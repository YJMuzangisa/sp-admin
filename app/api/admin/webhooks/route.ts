// app/api/admin/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET — fetch webhook logs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const limit = parseInt(searchParams.get('limit') || '100');

  const where = status !== 'all' ? `WHERE status = '${status}'` : '';

  const logs = await prisma.$queryRawUnsafe(`
    SELECT id, "createdAt", event, reference, "businessId", status, error, "processedAt", "retryCount"
    FROM "WebhookLog"
    ${where}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `);

  return NextResponse.json(logs);
}

// POST — retry a failed webhook by re-sending its payload to SalesPath webhook endpoint
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { logId } = await req.json();
  if (!logId) return NextResponse.json({ error: 'logId required' }, { status: 400 });

  const logs = await prisma.$queryRaw<[{ id: string; payload: any; retryCount: number }]>`
    SELECT id, payload, "retryCount" FROM "WebhookLog" WHERE id = ${logId}
  `;

  const log = logs[0];
  if (!log) return NextResponse.json({ error: 'Log not found' }, { status: 404 });

  try {
    // Re-send payload directly to SalesPath webhook handler
    const salesPathUrl = process.env.SALESPATH_URL || 'https://salespath.co.za';
    const payload = JSON.stringify(log.payload);

    const crypto = await import('crypto');
    const signature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(payload)
      .digest('hex');

    const res = await fetch(`${salesPathUrl}/api/webhooks/paystack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature,
      },
      body: payload,
    });

    if (!res.ok) throw new Error(`SalesPath returned ${res.status}`);

    // Mark as processed
    await prisma.$queryRaw`
      UPDATE "WebhookLog"
      SET status = 'PROCESSED',
          "processedAt" = NOW(),
          "retryCount" = "retryCount" + 1,
          error = NULL
      WHERE id = ${logId}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await prisma.$queryRaw`
      UPDATE "WebhookLog"
      SET "retryCount" = "retryCount" + 1,
          error = ${error?.message || 'Unknown error'}
      WHERE id = ${logId}
    `;

    return NextResponse.json({ error: error?.message || 'Retry failed' }, { status: 500 });
  }
}