import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, isHQRole } from '@/lib/auth';

// GET all Item Categories
export async function GET() {
  try {
    const categories = await prisma.itemCategory.findMany({
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST Create new Item Category (HQ roles)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ privileges required' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await prisma.itemCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

// PUT Update existing Item Category (HQ roles)
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ privileges required' }, { status: 403 });
    }

    const { id, name, description } = await request.json();

    if (!id || !name || name.trim() === '') {
      return NextResponse.json({ error: 'Category ID and Name are required' }, { status: 400 });
    }

    const category = await prisma.itemCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

// DELETE Item Category (HQ roles)
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isHQRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: HQ privileges required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await prisma.itemCategory.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
