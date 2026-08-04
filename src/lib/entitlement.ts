import { Gender, KitItem, StationManpower } from '@prisma/client';

export interface EntitlementCalculationResult {
  maxAllowed: number;
  scaleOfIssue: number;
  applicableHeadcount: number;
  targetGender: Gender;
}

export interface LifecycleLockResult {
  isLocked: boolean;
  lastIssuedDate: Date | null;
  lifeCycleYears: number;
  nextEligibleDate: Date | null;
  daysRemaining: number;
  message?: string;
}

/**
 * Calculates Maximum Authorized Entitlement Ceiling for a station and item:
 * Max Allowed = Authorized Scale * Gender-based Station Manpower
 */
export function calculateMaxEntitlement(
  item: { scaleOfIssue: number | any; targetGender: Gender },
  manpower: { heldMale: number; heldFemale: number; totalHeld: number } | null
): EntitlementCalculationResult {
  if (!manpower) {
    return {
      maxAllowed: 0,
      scaleOfIssue: Number(item.scaleOfIssue) || 0,
      applicableHeadcount: 0,
      targetGender: item.targetGender,
    };
  }

  const scale = Number(item.scaleOfIssue) || 0;
  let headcount = manpower.totalHeld;

  if (item.targetGender === Gender.MALE) {
    headcount = manpower.heldMale;
  } else if (item.targetGender === Gender.FEMALE) {
    headcount = manpower.heldFemale;
  }

  const maxAllowed = Math.floor(scale * headcount);

  return {
    maxAllowed,
    scaleOfIssue: scale,
    applicableHeadcount: headcount,
    targetGender: item.targetGender,
  };
}

/**
 * Enforces Lifecycle Lock Rule:
 * Re-orders are blocked if the replacement period (e.g. 1, 2, 4 years) has not elapsed since last issuance date.
 */
export function checkLifecycleLock(
  lastIssuedDate: Date | string | null | undefined,
  lifeCycleYears: number
): LifecycleLockResult {
  if (!lastIssuedDate) {
    return {
      isLocked: false,
      lastIssuedDate: null,
      lifeCycleYears,
      nextEligibleDate: null,
      daysRemaining: 0,
    };
  }

  const lastDate = new Date(lastIssuedDate);
  const now = new Date();

  // Next eligible date = lastIssuedDate + lifeCycleYears
  const nextEligibleDate = new Date(lastDate);
  nextEligibleDate.setFullYear(nextEligibleDate.getFullYear() + lifeCycleYears);

  if (now < nextEligibleDate) {
    const diffTime = nextEligibleDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isLocked: true,
      lastIssuedDate: lastDate,
      lifeCycleYears,
      nextEligibleDate,
      daysRemaining,
      message: `Lifecycle Lock Active: Item replacement cycle is ${lifeCycleYears} year(s). Next eligible re-order date is ${nextEligibleDate.toISOString().split('T')[0]} (${daysRemaining} days remaining).`,
    };
  }

  return {
    isLocked: false,
    lastIssuedDate: lastDate,
    lifeCycleYears,
    nextEligibleDate,
    daysRemaining: 0,
  };
}
