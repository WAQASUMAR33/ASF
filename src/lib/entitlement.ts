import { Gender, KitItem, StationManpower } from '@prisma/client';

export interface EntitlementCalculationResult {
  maxAllowed: number;
  scaleOfIssue: number;
  applicableHeadcount: number;
  targetGender: Gender;
}

export interface LifecycleLockResult {
  isLocked: boolean;
  lastReceiptDate: Date | null;
  lastIssuedDate?: Date | null; // Compatibility alias
  lifeCycleYears: number;
  nextEligibleDate: Date | null;
  daysRemaining: number;
  authorizedQty: number;
  lastReceivedQty: number;
  netMaxAllowed: number;
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
 * Enforces Replacement Lifecycle Lock & Partial Entitlement Ceiling Rule:
 * Re-orders calculate net max allowed = Authorized Qty - Last Received Qty if within active lifecycle period.
 */
export function checkLifecycleLock(
  lastReceiptDate: Date | string | null | undefined,
  lifeCycleYears: number,
  authorizedQty: number = 0,
  lastReceivedQty: number = 0
): LifecycleLockResult {
  const parsedAuthQty = Number(authorizedQty) || 0;
  const parsedReceivedQty = Number(lastReceivedQty) || 0;

  if (!lastReceiptDate) {
    return {
      isLocked: false,
      lastReceiptDate: null,
      lastIssuedDate: null,
      lifeCycleYears,
      nextEligibleDate: null,
      daysRemaining: 0,
      authorizedQty: parsedAuthQty,
      lastReceivedQty: 0,
      netMaxAllowed: parsedAuthQty,
    };
  }

  const lastDate = new Date(lastReceiptDate);
  const now = new Date();

  // Next eligible full re-order date = lastReceiptDate + lifeCycleYears
  const nextEligibleDate = new Date(lastDate);
  nextEligibleDate.setFullYear(nextEligibleDate.getFullYear() + lifeCycleYears);

  const withinLifecycle = now < nextEligibleDate;
  const diffTime = nextEligibleDate.getTime() - now.getTime();
  const daysRemaining = withinLifecycle ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  // If within active lifecycle, Net Max Allowed = Authorized Qty - Last Received Qty
  const netMaxAllowed = withinLifecycle
    ? Math.max(0, parsedAuthQty - parsedReceivedQty)
    : parsedAuthQty;

  const isLocked = withinLifecycle && netMaxAllowed <= 0;

  let message = undefined;
  if (isLocked) {
    message = `Lifecycle Lock Active: Full entitlement (${parsedReceivedQty}/${parsedAuthQty}) received on ${lastDate.toISOString().split('T')[0]}. Next eligible full re-order date is ${nextEligibleDate.toISOString().split('T')[0]}.`;
  } else if (withinLifecycle && parsedReceivedQty > 0) {
    message = `Partial Entitlement: ${parsedAuthQty} Authorized - ${parsedReceivedQty} Received = ${netMaxAllowed} Net Eligible.`;
  }

  return {
    isLocked,
    lastReceiptDate: lastDate,
    lastIssuedDate: lastDate,
    lifeCycleYears,
    nextEligibleDate,
    daysRemaining,
    authorizedQty: parsedAuthQty,
    lastReceivedQty: parsedReceivedQty,
    netMaxAllowed,
    message,
  };
}
