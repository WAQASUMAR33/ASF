import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'asf_ims_enterprise_secret_key_jwt_2026_super_secure';
export const AUTH_COOKIE_NAME = 'asf_auth_token';

export interface JWTPayload {
  userId: string;
  username: string;
  role: Role;
  stationId: string | null;
  is2FAVerified: boolean;
  sessionId: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Verify active user in DB
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      station: true,
    },
  });

  if (!user || !user.isActive) return null;

  return {
    ...user,
    is2FAVerified: payload.is2FAVerified,
    sessionId: payload.sessionId,
  };
}

export function isStationLevelRole(role: Role): boolean {
  return ([Role.STORE_CLERK, Role.STORE_OFFICER, Role.CSO] as Role[]).includes(role);
}

export function isHQRole(role: Role): boolean {
  return ([Role.DD_PROCUREMENT, Role.CENTRAL_STORE, Role.SYSTEM_ADMIN] as Role[]).includes(role);
}

/**
 * Enforces Station Isolation:
 * Returns station filter condition based on user role and assigned station.
 */
export function getStationScope(user: { role: Role; stationId: string | null }, targetStationId?: string) {
  if (isStationLevelRole(user.role)) {
    if (!user.stationId) {
      throw new Error('Station assignment required for station-level role');
    }
    return { stationId: user.stationId };
  }

  // HQ role: can filter by targetStationId if provided, or see all
  if (targetStationId && targetStationId !== 'ALL') {
    return { stationId: targetStationId };
  }

  return {};
}
