// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'all';
  const days = parseInt(searchParams.get('days') || '0');
  const search = searchParams.get('search') || '';

  try {
    const where: any = {};

    if (category !== 'all') {
      where.category = category;
    }

    if (days > 0) {
      where.createdAt = {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      };
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        business: {
          include: {
            owner: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by search after join
    const filtered = search
      ? feedback.filter(
          f =>
            f.business.name.toLowerCase().includes(search.toLowerCase()) ||
            f.message.toLowerCase().includes(search.toLowerCase()) ||
            (f.business.owner.email || '').toLowerCase().includes(search.toLowerCase())
        )
      : feedback;

    // Stats
    const total = filtered.length;
    const featureRequests = filtered.filter(f => f.category === 'Feature Request Survey');
    const npsEntries = filtered.filter(f => f.category === 'NPS Survey');

    // NPS average
    let npsAvg = 0;
    if (npsEntries.length > 0) {
      const scores = npsEntries
        .map(f => {
          const match = f.message.match(/NPS Score: (\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((s): s is number => s !== null);
      npsAvg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    }

    // NPS breakdown
    const npsScores = npsEntries
      .map(f => {
        const match = f.message.match(/NPS Score: (\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((s): s is number => s !== null);

    const promoters = npsScores.filter(s => s >= 9).length;
    const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
    const detractors = npsScores.filter(s => s <= 6).length;
    const npsScore = npsScores.length > 0
      ? Math.round(((promoters - detractors) / npsScores.length) * 100)
      : 0;

    // Feature request tally
    const featureCounts: Record<string, number> = {};
    featureRequests.forEach(f => {
      const match = f.message.match(/Feature requests: (.+)/);
      if (match) {
        match[1].split(',').map(s => s.trim()).forEach(feat => {
          featureCounts[feat] = (featureCounts[feat] || 0) + 1;
        });
      }
    });

    const featureLabels: Record<string, string> = {
      bulk_pricing: 'Bulk pricing rules',
      competitor_alerts: 'Competitor alerts',
      amazon_integration: 'Amazon integration',
      reports: 'Reports',
      price_history: 'Price history',
      mobile_app: 'Mobile app',
    };

    const featureStats = Object.entries(featureCounts)
      .map(([id, count]) => ({ id, label: featureLabels[id] || id, count }))
      .sort((a, b) => b.count - a.count);

    // This month count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonth = filtered.filter(f => new Date(f.createdAt) >= startOfMonth).length;

    return NextResponse.json({
      feedback: filtered,
      stats: {
        total,
        featureRequestCount: featureRequests.length,
        npsAvg,
        npsScore,
        promoters,
        passives,
        detractors,
        npsTotal: npsScores.length,
        thisMonth,
        featureStats,
      },
    });
  } catch (error) {
    console.error('[feedback/route] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}