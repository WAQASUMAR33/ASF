import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getStationScope } from '@/lib/auth';
import { DemandStatus, DistributionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stationIdParam = searchParams.get('stationId') || undefined;

    const stationScope = getStationScope(user, stationIdParam);

    // KPI 1: Active Demands Count
    const activeDemandsCount = await prisma.stationDemand.count({
      where: {
        ...stationScope,
        status: { in: [DemandStatus.PENDING_STORE_OFFICER, DemandStatus.PENDING_CSO, DemandStatus.APPROVED_BY_STATION] },
      },
    });

    // KPI 2: Total Dispatched Shipments
    const issuedDistributionsCount = await prisma.inventoryDistribution.count({
      where: {
        ...stationScope,
        status: DistributionStatus.ISSUED,
      },
    });

    // KPI 3: Total Stations Count & Total Manpower
    const totalStations = await prisma.station.count({ where: { isActive: true } });
    const manpowerAggregate = await prisma.stationManpower.aggregate({
      _sum: { totalHeld: true, heldMale: true, heldFemale: true },
    });

    // KPI 4: Shortfall comparison per station (Demanded vs Central Stock Available)
    const approvedDemandItems = await prisma.stationDemandItem.findMany({
      where: {
        demand: {
          status: { in: [DemandStatus.APPROVED_BY_STATION, DemandStatus.HQ_CONSOLIDATED] },
          ...stationScope,
        },
      },
      include: {
        demand: { include: { station: true } },
        item: true,
      },
    });

    const stationShortfallMap: Record<string, { stationName: string; stationCode: string; demanded: number; fulfilled: number }> = {};

    for (const dItem of approvedDemandItems) {
      const code = dItem.demand.station.code;
      if (!stationShortfallMap[code]) {
        stationShortfallMap[code] = {
          stationName: dItem.demand.station.name,
          stationCode: code,
          demanded: 0,
          fulfilled: 0,
        };
      }
      const qty = dItem.approvedQuantity || dItem.demandedQuantity;
      stationShortfallMap[code].demanded += qty;
    }

    const stationShortfallChart = Object.values(stationShortfallMap).slice(0, 10);

    // Size distribution analysis for top item (Camouflage Uniform)
    const sizeDistribution = await prisma.stationDemandItem.groupBy({
      by: ['sizeId'],
      _sum: { demandedQuantity: true },
      where: { sizeId: { not: null } },
    });

    const sizeIds = sizeDistribution.map((s) => s.sizeId!).filter(Boolean);
    const sizeCharts = await prisma.itemSizeChart.findMany({
      where: { id: { in: sizeIds } },
    });

    const sizeChartMap: Record<string, string> = {};
    sizeCharts.forEach((sc) => {
      sizeChartMap[sc.id] = sc.sizeLabel;
    });

    const sizeBreakdown = sizeDistribution.map((s) => ({
      sizeLabel: sizeChartMap[s.sizeId!] || 'Other',
      quantity: s._sum.demandedQuantity || 0,
    }));

    return NextResponse.json({
      metrics: {
        activeDemandsCount,
        issuedDistributionsCount,
        totalStations,
        totalHeadcount: manpowerAggregate._sum.totalHeld || 0,
        maleHeadcount: manpowerAggregate._sum.heldMale || 0,
        femaleHeadcount: manpowerAggregate._sum.heldFemale || 0,
      },
      stationShortfallChart,
      sizeBreakdown,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate analytics' }, { status: 500 });
  }
}
