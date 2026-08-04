import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isHQRole } from '@/lib/auth';

// GET stations list (with manpower counts)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stations = await prisma.station.findMany({
      include: {
        manpower: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ stations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}

// POST create or update station manpower matrix (SYSTEM_ADMIN or HQ)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ level role required' }, { status: 403 });
    }

    const { stationId, code, name, heldMale, heldFemale } = await request.json();

    if (stationId) {
      // Update Manpower
      const male = Number(heldMale) || 0;
      const female = Number(heldFemale) || 0;
      const total = male + female;

      const manpower = await prisma.stationManpower.upsert({
        where: { stationId },
        update: { heldMale: male, heldFemale: female, totalHeld: total },
        create: { stationId, heldMale: male, heldFemale: female, totalHeld: total },
      });

      return NextResponse.json({ success: true, manpower });
    }

    // Create New Station
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and Name are required' }, { status: 400 });
    }

    const station = await prisma.station.create({
      data: {
        code: code.toUpperCase(),
        name,
        manpower: {
          create: {
            heldMale: Number(heldMale) || 0,
            heldFemale: Number(heldFemale) || 0,
            totalHeld: (Number(heldMale) || 0) + (Number(heldFemale) || 0),
          },
        },
      },
      include: { manpower: true },
    });

    return NextResponse.json({ success: true, station });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update station' }, { status: 500 });
  }
}
