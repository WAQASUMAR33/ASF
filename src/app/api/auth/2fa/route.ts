import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generate2FASecret, generateQRCodeDataURL, verify2FAToken, generateBackupCodes } from '@/lib/totp';
import { signToken, AUTH_COOKIE_NAME, getCurrentUser } from '@/lib/auth';

// Setup 2FA
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { secret, otpauth } = generate2FASecret(user.username);
    const qrCodeUrl = await generateQRCodeDataURL(otpauth);

    // Store temp secret in user record
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorTempSecret: secret },
    });

    return NextResponse.json({
      secret,
      qrCodeUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initialize 2FA' }, { status: 500 });
  }
}

// Verify 2FA (during login or during setup confirmation)
export async function POST(request: Request) {
  try {
    const { userId, code, action } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Security code is required' }, { status: 400 });
    }

    // Handle setup confirmation
    if (action === 'ENABLE_2FA') {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.twoFactorTempSecret) {
        return NextResponse.json({ error: 'Invalid 2FA setup session' }, { status: 400 });
      }

      const isValid = verify2FAToken(code, currentUser.twoFactorTempSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      const backupCodes = generateBackupCodes();

      await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: currentUser.twoFactorTempSecret,
          twoFactorTempSecret: null,
          twoFactorConfirmedAt: new Date(),
          backupCodes: backupCodes,
        },
      });

      return NextResponse.json({ success: true, backupCodes });
    }

    // Handle 2FA verification during login
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { station: true },
    });

    if (!dbUser || !dbUser.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not enabled for user' }, { status: 400 });
    }

    // Check TOTP code or backup codes
    let isValid = verify2FAToken(code, dbUser.twoFactorSecret);

    if (!isValid && Array.isArray(dbUser.backupCodes)) {
      const backupIndex = (dbUser.backupCodes as string[]).indexOf(code);
      if (backupIndex !== -1) {
        isValid = true;
        // Remove used backup code
        const updatedBackup = [...(dbUser.backupCodes as string[])];
        updatedBackup.splice(backupIndex, 1);
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { backupCodes: updatedBackup },
        });
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 2FA code or backup key' }, { status: 401 });
    }

    // Create session token
    const session = await prisma.userSession.create({
      data: {
        userId: dbUser.id,
        token: Math.random().toString(36).substring(2) + Date.now().toString(36),
        is2FAVerified: true,
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
      },
    });

    const token = signToken({
      userId: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      stationId: dbUser.stationId,
      is2FAVerified: true,
      sessionId: session.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        fullName: dbUser.fullName,
        role: dbUser.role,
        station: dbUser.station,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 3600,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('2FA Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
