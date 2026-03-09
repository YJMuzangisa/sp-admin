import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
//import axios from 'axios';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function GET() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const upcoming = await prisma.$queryRaw<Array<{
      businessId: string;
      businessName: string;
      subscriptionId: string;
      status: string;
      planName: string;
      planPrice: number;
      nextBillingDate: Date;
      lastPaymentDate: Date | null;
      paystackSubscriptionCode: string | null;
      paystackCustomerCode: string | null;
    }>>`
      SELECT 
        b.id AS "businessId",
        b.name AS "businessName",
        s.id AS "subscriptionId",
        s.status,
        p.name AS "planName",
        p.price AS "planPrice",
        s."nextBillingDate",
        s."lastPaymentDate",
        s."paystackSubscriptionCode",
        s."paystackCustomerCode"
      FROM "Subscription" s
      JOIN "Business" b ON b.id = s."businessId"
      JOIN "Plan" p ON p.id = s."planId"
      WHERE s."nextBillingDate" IS NOT NULL
        AND s."nextBillingDate" >= ${now}
        AND s."nextBillingDate" <= ${threeDaysFromNow}
      ORDER BY s."nextBillingDate" ASC
    `;

    const results = upcoming.map((row) => ({
      ...row,
      planPrice: Number(row.planPrice),
      nextBillingDate: row.nextBillingDate.toISOString(),
      lastPaymentDate: row.lastPaymentDate?.toISOString() || null,
    }));

    return NextResponse.json({ upcoming: results });
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming renewals' }, { status: 500 });
  }
}

// POST: Cancel a subscription before it charges
export async function POST(request: Request) {
  try {
    const { subscriptionCode, subscriptionId } = await request.json();

    if (!subscriptionCode) {
      return NextResponse.json({ error: 'Subscription code required' }, { status: 400 });
    }

    // Get the email token from the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription?.payStackEmailToken) {
      return NextResponse.json({ error: 'No email token found — cancel manually on Paystack' }, { status: 400 });
    }

    // Disable on Paystack
    const response = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: subscription.payStackEmailToken,
      }),
    });

    const data = await response.json();
    if (!data.status) {
      return NextResponse.json({ error: data.message || 'Paystack cancellation failed' }, { status: 500 });
    }

    // Update local DB
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        nextBillingDate: null,
      },
    });

    return NextResponse.json({ success: true, message: `Subscription ${subscriptionCode} cancelled` });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel subscription' }, { status: 500 });
  }
}