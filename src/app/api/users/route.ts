import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const canManageUsers = user && (user.role === Role.SYSTEM_ADMIN || user.role === Role.DD_PROCUREMENT || user.role === Role.CENTRAL_STORE);
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Forbidden: Admin / HQ role required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: { station: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = user.role === Role.SYSTEM_ADMIN || user.role === Role.DD_PROCUREMENT || user.role === Role.CENTRAL_STORE;
    const { username, email, fullName, role, stationId, password, proposedByAssistant } = await request.json();

    if (!username || !fullName || !role || !password) {
      return NextResponse.json({ error: 'Username, Full Name, Role and Password are required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // If created by Super Admin (DD Procurement / System Admin), activate immediately. Otherwise mark pending approval (isActive: false)
    const initialActiveState = isSuperAdmin ? true : false;

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        role: role as Role,
        stationId: stationId || null,
        passwordHash,
        isActive: initialActiveState,
      },
      include: { station: true },
    });

    return NextResponse.json({ success: true, user: newUser, isPendingApproval: !initialActiveState });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
