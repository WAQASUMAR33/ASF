import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isHQRole } from '@/lib/auth';
import { AccountingUnit, Gender } from '@prisma/client';

// GET Kit Items Catalog with categories, sizes & central stock
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.kitItem.findMany({
      include: {
        category: true,
        sizes: {
          orderBy: { sortOrder: 'asc' },
        },
        centralStock: {
          include: { size: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const categories = await prisma.itemCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ items, categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
  }
}

// POST create or update kit item & sizes (DD_PROCUREMENT or SYSTEM_ADMIN)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      itemCode,
      name,
      categoryId,
      unitOfIssue,
      scaleOfIssue,
      lifeCycleYears,
      targetGender,
      isSeasonal,
      requiresMeasurement,
      specSheetUrl,
      sizes,
    } = body;

    if (!itemCode || !name || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (id) {
      // Update item
      const item = await prisma.kitItem.update({
        where: { id },
        data: {
          itemCode,
          name,
          categoryId,
          unitOfIssue: unitOfIssue as AccountingUnit,
          scaleOfIssue: parseFloat(scaleOfIssue),
          lifeCycleYears: parseInt(lifeCycleYears, 10),
          targetGender: targetGender as Gender,
          isSeasonal: Boolean(isSeasonal),
          requiresMeasurement: Boolean(requiresMeasurement),
          specSheetUrl,
        },
      });

      return NextResponse.json({ success: true, item });
    }

    // Create item
    const newItem = await prisma.kitItem.create({
      data: {
        itemCode,
        name,
        categoryId,
        unitOfIssue: unitOfIssue as AccountingUnit,
        scaleOfIssue: parseFloat(scaleOfIssue),
        lifeCycleYears: parseInt(lifeCycleYears, 10),
        targetGender: targetGender as Gender,
        isSeasonal: Boolean(isSeasonal),
        requiresMeasurement: Boolean(requiresMeasurement),
        specSheetUrl,
        sizes: sizes && Array.isArray(sizes) ? {
          create: sizes.map((s: string, idx: number) => ({
            sizeLabel: s,
            sortOrder: idx + 1,
          })),
        } : undefined,
      },
      include: { sizes: true },
    });

    // Create default central stock entries for new item
    if (newItem.sizes.length > 0) {
      for (const sz of newItem.sizes) {
        await prisma.centralStock.create({
          data: {
            itemId: newItem.id,
            sizeId: sz.id,
            availableQty: 0,
            reservedQty: 0,
          },
        });
      }
    } else {
      await prisma.centralStock.create({
        data: {
          itemId: newItem.id,
          sizeId: null,
          availableQty: 0,
          reservedQty: 0,
        },
      });
    }

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error('Save kit item error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save kit item' }, { status: 500 });
  }
}

// DELETE kit item by ID or wipe all catalog entries
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const wipeAll = searchParams.get('wipeAll');

    if (wipeAll === 'true') {
      await prisma.distributionItem.deleteMany();
      await prisma.inventoryDistribution.deleteMany();
      await prisma.stationDemandItem.deleteMany();
      await prisma.stationDemand.deleteMany();
      await prisma.centralStock.deleteMany();
      await prisma.itemSizeChart.deleteMany();
      await prisma.kitItem.deleteMany();
      return NextResponse.json({ success: true, message: 'All catalog items wiped successfully' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    await prisma.centralStock.deleteMany({ where: { itemId: id } });
    await prisma.itemSizeChart.deleteMany({ where: { itemId: id } });
    await prisma.kitItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
  }
}
