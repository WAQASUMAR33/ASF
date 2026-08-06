import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (token) {
      const payload = verifyToken(token);
      if (payload?.sessionId) {
        // Invalidate session in database
        await prisma.userSession.deleteMany({
          where: { id: payload.sessionId },
        }).catch(() => {});
      }
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear authentication HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}
