import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: SYSTEM_ADMIN role required' }, { status: 403 });
    }

    const userId = params.id;
    const body = await request.json();
    const { fullName, email, role, stationId, isActive, password } = body;

    // Self-protection check: prevent deactivating own active account
    if (userId === currentUser.id && isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own logged-in admin account' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role as Role;
    if (stationId !== undefined) {
      updateData.stationId = ['STORE_CLERK', 'STORE_OFFICER', 'CSO'].includes(role || existingUser.role) ? stationId : null;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { station: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== Role.SYSTEM_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: SYSTEM_ADMIN role required' }, { status: 403 });
    }

    const userId = params.id;

    // Self-protection check: prevent deleting own active account
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own logged-in admin account' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: 'User account removed successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove user account' }, { status: 500 });
  }
}
