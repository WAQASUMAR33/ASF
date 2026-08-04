import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getStationScope, isStationLevelRole } from '@/lib/auth';
import { calculateMaxEntitlement, checkLifecycleLock } from '@/lib/entitlement';
import { DemandStatus, Role } from '@prisma/client';

// GET station demands (filtered by station for station roles)
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetStationId = searchParams.get('stationId') || undefined;

    const stationScope = getStationScope(user, targetStationId);

    const demands = await prisma.stationDemand.findMany({
      where: stationScope,
      include: {
        station: true,
        createdBy: {
          select: { id: true, fullName: true, role: true, username: true },
        },
        items: {
          include: {
            item: { include: { category: true } },
            size: true,
          },
        },
        auditLogs: {
          include: { user: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ demands });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch demands' }, { status: 500 });
  }
}

// POST Create new Station Demand (STORE_CLERK)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== Role.STORE_CLERK && user.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: 'Only STORE_CLERK can draft station demands' }, { status: 403 });
    }

    if (!user.stationId) {
      return NextResponse.json({ error: 'User is not assigned to any ASF Station' }, { status: 400 });
    }

    const { fiscalYear, items } = await request.json(); // items: Array<{ itemId, sizeId, customMeasurement, demandedQuantity, lastIssuedDate }>

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required in demand' }, { status: 400 });
    }

    // Fetch station manpower
    const manpower = await prisma.stationManpower.findUnique({
      where: { stationId: user.stationId },
    });

    // Generate unique demand number e.g. DEM-KHI-2026-0042
    const demandCount = await prisma.stationDemand.count({
      where: { stationId: user.stationId },
    });
    const stationObj = await prisma.station.findUnique({ where: { id: user.stationId } });
    const demandNumber = `DEM-${stationObj?.code || 'STN'}-${fiscalYear || new Date().getFullYear()}-${String(demandCount + 1).padStart(4, '0')}`;

    // Process & Validate each demand item against Entitlement Ceiling & Lifecycle Lock
    const preparedItems = [];
    const validationErrors = [];

    for (const rawItem of items) {
      const dbItem = await prisma.kitItem.findUnique({
        where: { id: rawItem.itemId },
      });

      if (!dbItem) continue;

      // Calculate entitlement ceiling
      const entitlement = calculateMaxEntitlement(dbItem, manpower);
      const demandedQty = parseInt(rawItem.demandedQuantity, 10);

      // Check Lifecycle Lock
      const lockCheck = checkLifecycleLock(rawItem.lastIssuedDate, dbItem.lifeCycleYears);
      if (lockCheck.isLocked) {
        validationErrors.push(
          `Item ${dbItem.name} is under Lifecycle Lock: Re-order blocked until ${lockCheck.nextEligibleDate?.toISOString().split('T')[0]}`
        );
      }

      if (demandedQty > entitlement.maxAllowed) {
        validationErrors.push(
          `Demanded quantity (${demandedQty}) for ${dbItem.name} exceeds max allowed entitlement ceiling (${entitlement.maxAllowed})`
        );
      }

      preparedItems.push({
        itemId: dbItem.id,
        sizeId: rawItem.sizeId || null,
        customMeasurement: rawItem.customMeasurement || null,
        calculatedMaxAllowed: entitlement.maxAllowed,
        demandedQuantity: demandedQty,
        approvedQuantity: demandedQty,
        lastIssuedDate: rawItem.lastIssuedDate ? new Date(rawItem.lastIssuedDate) : null,
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: 'Validation Failed', details: validationErrors }, { status: 400 });
    }

    // Create Station Demand & Audit Log
    const demand = await prisma.stationDemand.create({
      data: {
        demandNumber,
        stationId: user.stationId,
        fiscalYear: parseInt(fiscalYear, 10) || new Date().getFullYear(),
        status: DemandStatus.DRAFT,
        createdById: user.id,
        items: {
          create: preparedItems,
        },
        auditLogs: {
          create: {
            actionBy: user.id,
            fromStatus: DemandStatus.DRAFT,
            toStatus: DemandStatus.DRAFT,
            comments: 'Initial station demand drafted',
          },
        },
      },
      include: {
        items: { include: { item: true, size: true } },
        station: true,
      },
    });

    return NextResponse.json({ success: true, demand });
  } catch (error: any) {
    console.error('Create demand error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create demand' }, { status: 500 });
  }
}

// PUT Transition Demand State Machine
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { demandId, targetStatus, comments, rejectionNote } = await request.json();

    const demand = await prisma.stationDemand.findUnique({
      where: { id: demandId },
      include: { station: true },
    });

    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    // Station level role check: ensure user belongs to demand's station
    if (isStationLevelRole(user.role) && demand.stationId !== user.stationId) {
      return NextResponse.json({ error: 'Access denied to this station demand' }, { status: 403 });
    }

    const currentStatus = demand.status;
    let allowed = false;

    // RBAC & State Transition Rules:
    // STORE_CLERK: DRAFT -> PENDING_STORE_OFFICER
    if (user.role === Role.STORE_CLERK) {
      if (currentStatus === DemandStatus.DRAFT || currentStatus === DemandStatus.RETURNED_TO_CLERK) {
        if (targetStatus === DemandStatus.PENDING_STORE_OFFICER) allowed = true;
      }
    }

    // STORE_OFFICER: PENDING_STORE_OFFICER -> PENDING_CSO OR RETURNED_TO_CLERK
    if (user.role === Role.STORE_OFFICER) {
      if (currentStatus === DemandStatus.PENDING_STORE_OFFICER) {
        if (targetStatus === DemandStatus.PENDING_CSO || targetStatus === DemandStatus.RETURNED_TO_CLERK) allowed = true;
      }
    }

    // CSO: PENDING_CSO -> APPROVED_BY_STATION OR RETURNED_TO_CLERK
    if (user.role === Role.CSO) {
      if (currentStatus === DemandStatus.PENDING_CSO) {
        if (targetStatus === DemandStatus.APPROVED_BY_STATION || targetStatus === DemandStatus.RETURNED_TO_CLERK) allowed = true;
      }
    }

    // DD_PROCUREMENT / SYSTEM_ADMIN can promote to APPROVED_BY_STATION or HQ_CONSOLIDATED
    if (user.role === Role.DD_PROCUREMENT || user.role === Role.SYSTEM_ADMIN) {
      allowed = true;
    }

    if (!allowed) {
      return NextResponse.json(
        { error: `Role ${user.role} is not authorized to transition demand state from ${currentStatus} to ${targetStatus}` },
        { status: 403 }
      );
    }

    // Execute state transition
    const updatedDemand = await prisma.stationDemand.update({
      where: { id: demandId },
      data: {
        status: targetStatus as DemandStatus,
        rejectionNote: targetStatus === DemandStatus.RETURNED_TO_CLERK ? rejectionNote || comments : demand.rejectionNote,
        auditLogs: {
          create: {
            actionBy: user.id,
            fromStatus: currentStatus,
            toStatus: targetStatus as DemandStatus,
            comments: comments || `State updated to ${targetStatus}`,
          },
        },
      },
      include: {
        auditLogs: { include: { user: true } },
        items: true,
      },
    });

    return NextResponse.json({ success: true, demand: updatedDemand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update demand state' }, { status: 500 });
  }
}
