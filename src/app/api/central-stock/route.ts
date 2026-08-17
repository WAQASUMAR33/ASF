import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isHQRole } from '@/lib/auth';

// GET all Central Stock records
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stocks = await prisma.centralStock.findMany({
      include: {
        item: {
          include: { category: true },
        },
        size: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ stocks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch central stock' }, { status: 500 });
  }
}

// POST / PUT update available stock quantity (CENTRAL_STORE, DD_PROCUREMENT, SYSTEM_ADMIN)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Central Store / HQ privileges required' }, { status: 403 });
    }

    const { itemId, sizeId, availableQty } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const parsedQty = Math.max(0, parseInt(availableQty, 10) || 0);

    // Upsert central stock entry
    const existingStock = await prisma.centralStock.findFirst({
      where: {
        itemId,
        sizeId: sizeId || null,
      },
    });

    let stock;
    if (existingStock) {
      stock = await prisma.centralStock.update({
        where: { id: existingStock.id },
        data: { availableQty: parsedQty },
        include: { item: true, size: true },
      });
    } else {
      stock = await prisma.centralStock.create({
        data: {
          itemId,
          sizeId: sizeId || null,
          availableQty: parsedQty,
          reservedQty: 0,
        },
        include: { item: true, size: true },
      });
    }

    return NextResponse.json({ success: true, stock });
  } catch (error: any) {
    console.error('Update central stock error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update central stock' }, { status: 500 });
  }
}
