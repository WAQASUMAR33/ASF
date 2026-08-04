import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isHQRole } from '@/lib/auth';
import { DistributionStatus, Role } from '@prisma/client';

// GET distributions list
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId') || undefined;

    const distributions = await prisma.inventoryDistribution.findMany({
      where: stationId ? { stationId } : undefined,
      include: {
        station: true,
        items: {
          include: { item: true, size: true },
        },
        auditLogs: {
          include: { user: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ distributions });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch distributions' }, { status: 500 });
  }
}

// POST Create new Distribution Draft (CENTRAL_STORE)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== Role.CENTRAL_STORE && user.role !== Role.SYSTEM_ADMIN)) {
      return NextResponse.json({ error: 'Only CENTRAL_STORE or SYSTEM_ADMIN can draft distribution allocations' }, { status: 403 });
    }

    const { stationId, notes, items } = await request.json(); // items: Array<{ itemId, sizeId, issuedQty }>

    if (!stationId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Station ID and items required' }, { status: 400 });
    }

    const dispatchCount = await prisma.inventoryDistribution.count();
    const stationObj = await prisma.station.findUnique({ where: { id: stationId } });
    const dispatchNumber = `DISP-${stationObj?.code || 'HQ'}-${new Date().getFullYear()}-${String(dispatchCount + 1).padStart(4, '0')}`;

    const distribution = await prisma.inventoryDistribution.create({
      data: {
        dispatchNumber,
        stationId,
        notes,
        status: DistributionStatus.DRAFT,
        items: {
          create: items.map((it: any) => ({
            itemId: it.itemId,
            sizeId: it.sizeId || null,
            issuedQty: parseInt(it.issuedQty, 10),
          })),
        },
        auditLogs: {
          create: {
            actionBy: user.id,
            fromStatus: DistributionStatus.DRAFT,
            toStatus: DistributionStatus.DRAFT,
            comments: 'Initial distribution allocation drafted by Central Store',
          },
        },
      },
      include: {
        items: { include: { item: true, size: true } },
        station: true,
      },
    });

    return NextResponse.json({ success: true, distribution });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create distribution' }, { status: 500 });
  }
}

// PUT State transition (DRAFT -> PENDING_DD_APPROVAL -> APPROVED -> ISSUED)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ privileges required' }, { status: 403 });
    }

    const { distributionId, targetStatus, comments } = await request.json();

    const dist = await prisma.inventoryDistribution.findUnique({
      where: { id: distributionId },
      include: { items: true },
    });

    if (!dist) {
      return NextResponse.json({ error: 'Distribution record not found' }, { status: 404 });
    }

    const currentStatus = dist.status;

    // RBAC validation for distribution workflow
    if (targetStatus === DistributionStatus.PENDING_DD_APPROVAL && user.role !== Role.CENTRAL_STORE && user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: 'Only CENTRAL_STORE can submit distribution for approval' }, { status: 403 });
    }

    if (targetStatus === DistributionStatus.APPROVED && user.role !== Role.DD_PROCUREMENT && user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: 'Only DD_PROCUREMENT can approve distribution allocations' }, { status: 403 });
    }

    if (targetStatus === DistributionStatus.ISSUED && user.role !== Role.CENTRAL_STORE && user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: 'Only CENTRAL_STORE can execute physical dispatch' }, { status: 403 });
    }

    // IF ISSUED: Execute Stock Deduction from Central Stock!
    if (targetStatus === DistributionStatus.ISSUED && currentStatus !== DistributionStatus.ISSUED) {
      for (const item of dist.items) {
        const stock = await prisma.centralStock.findFirst({
          where: {
            itemId: item.itemId,
            sizeId: item.sizeId || null,
          },
        });

        if (stock) {
          const newQty = Math.max(0, stock.availableQty - item.issuedQty);
          await prisma.centralStock.update({
            where: { id: stock.id },
            data: { availableQty: newQty },
          });
        }
      }
    }

    const updatedDist = await prisma.inventoryDistribution.update({
      where: { id: distributionId },
      data: {
        status: targetStatus as DistributionStatus,
        auditLogs: {
          create: {
            actionBy: user.id,
            fromStatus: currentStatus,
            toStatus: targetStatus as DistributionStatus,
            comments: comments || `Status updated to ${targetStatus}`,
          },
        },
      },
      include: {
        auditLogs: { include: { user: true } },
        items: { include: { item: true, size: true } },
      },
    });

    return NextResponse.json({ success: true, distribution: updatedDist });
  } catch (error: any) {
    console.error('Distribution transition error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update distribution status' }, { status: 500 });
  }
}
