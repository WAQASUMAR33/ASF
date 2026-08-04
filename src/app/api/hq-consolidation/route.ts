import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isHQRole } from '@/lib/auth';
import { DemandStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ level role required' }, { status: 403 });
    }

    // Get all station demand items that are APPROVED_BY_STATION or HQ_CONSOLIDATED
    const demandItems = await prisma.stationDemandItem.findMany({
      where: {
        demand: {
          status: {
            in: [DemandStatus.APPROVED_BY_STATION, DemandStatus.HQ_CONSOLIDATED],
          },
        },
      },
      include: {
        item: { include: { category: true } },
        size: true,
        demand: { include: { station: true } },
      },
    });

    // Group by itemId & sizeId
    const consolidatedMap: Record<string, any> = {};

    for (const dItem of demandItems) {
      const key = `${dItem.itemId}_${dItem.sizeId || 'NOSIZE'}`;
      const qty = dItem.approvedQuantity ?? dItem.demandedQuantity;

      if (!consolidatedMap[key]) {
        consolidatedMap[key] = {
          key,
          itemId: dItem.itemId,
          itemCode: dItem.item.itemCode,
          itemName: dItem.item.name,
          categoryName: dItem.item.category.name,
          unitOfIssue: dItem.item.unitOfIssue,
          sizeId: dItem.sizeId,
          sizeLabel: dItem.size?.sizeLabel || 'Standard',
          totalConsolidatedDemand: 0,
          stationBreakdown: [],
        };
      }

      consolidatedMap[key].totalConsolidatedDemand += qty;
      consolidatedMap[key].stationBreakdown.push({
        stationId: dItem.demand.stationId,
        stationCode: dItem.demand.station.code,
        stationName: dItem.demand.station.name,
        quantity: qty,
      });
    }

    // Fetch Central Warehouse Stock for matching item/size keys
    const centralStocks = await prisma.centralStock.findMany({
      include: { item: true, size: true },
    });

    const stockMap: Record<string, number> = {};
    for (const stock of centralStocks) {
      const key = `${stock.itemId}_${stock.sizeId || 'NOSIZE'}`;
      stockMap[key] = stock.availableQty;
    }

    // Apply Deficiency Formula:
    // Deficiency = Consolidated Demand - Central Warehouse Stock
    // Deficiency % = (Deficiency / Consolidated Demand) * 100
    const consolidatedResults = Object.values(consolidatedMap).map((row: any) => {
      const centralStockQty = stockMap[row.key] || 0;
      const deficiency = Math.max(0, row.totalConsolidatedDemand - centralStockQty);
      const deficiencyPercentage = row.totalConsolidatedDemand > 0
        ? ((deficiency / row.totalConsolidatedDemand) * 100).toFixed(1)
        : 0;

      return {
        ...row,
        centralStockQty,
        deficiency,
        deficiencyPercentage: Number(deficiencyPercentage),
        status: deficiency > 0 ? 'DEFICIENT' : 'SUFFICIENT',
      };
    });

    return NextResponse.json({
      consolidated: consolidatedResults,
      totalItemsCount: consolidatedResults.length,
      totalDeficientCount: consolidatedResults.filter((r) => r.deficiency > 0).length,
    });
  } catch (error: any) {
    console.error('HQ Consolidation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to compute HQ consolidation' }, { status: 500 });
  }
}
