import { KRDirection, KRStatus, ObjectiveHealth } from '../types';

/**
 * 8.1 KR achievement
 * INCREASE: (current - baseline) / (target - baseline) * 100
 * DECREASE: (baseline - current) / (baseline - target) * 100
 * Clamped to 0..100, rounded to 2 decimal places.
 */
export function calculateKRAchievement(
  direction: KRDirection,
  baseline: number,
  target: number,
  current: number
): number {
  if (direction === 'INCREASE') {
    if (target <= baseline) return 0;
    const raw = ((current - baseline) / (target - baseline)) * 100;
    const clamped = Math.min(100, Math.max(0, raw));
    return Math.round(clamped * 100) / 100;
  } else {
    // DECREASE
    if (baseline <= target) return 0;
    const raw = ((baseline - current) / (baseline - target)) * 100;
    const clamped = Math.min(100, Math.max(0, raw));
    return Math.round(clamped * 100) / 100;
  }
}

/**
 * 8.2 Objective progress
 * sum(KR achievement * KR weightage) / 100, 2 decimals
 */
export function calculateObjectiveProgress(
  keyResults: { achievementPercent: number; weightage: number }[]
): number {
  if (!keyResults || keyResults.length === 0) return 0;
  const total = keyResults.reduce((acc, kr) => {
    return acc + (kr.achievementPercent * (kr.weightage / 100));
  }, 0);
  return Math.round(Math.min(100, Math.max(0, total)) * 100) / 100;
}

/**
 * 8.3 Expected progress (time pace)
 * expected % = days elapsed from start date to asOfDate / total days from start to target * 100
 * Clamped 0..100, 2 decimals.
 */
export function calculateExpectedProgress(
  startDateStr: string,
  targetDateStr: string,
  asOfDateStr: string
): number {
  const start = new Date(startDateStr).getTime();
  const target = new Date(targetDateStr).getTime();
  const asOf = new Date(asOfDateStr).getTime();

  if (target <= start) return 100;
  if (asOf <= start) return 0;
  if (asOf >= target) return 100;

  const totalDuration = target - start;
  const elapsed = asOf - start;
  const expected = (elapsed / totalDuration) * 100;
  return Math.round(Math.min(100, Math.max(0, expected)) * 100) / 100;
}

/**
 * 8.4 KR status (automatic)
 * gap = achievement % - expected %
 * Completed if achievement = 100
 * On Track if gap >= -10
 * At Risk if gap < -10 and gap >= -25
 * In Trouble if gap < -25
 */
export function calculateKRStatus(
  achievementPercent: number,
  expectedPercent: number
): KRStatus {
  if (achievementPercent >= 100) {
    return 'Completed';
  }
  const gap = achievementPercent - expectedPercent;
  if (gap >= -10) {
    return 'On Track';
  } else if (gap >= -25) {
    return 'At Risk';
  } else {
    return 'In Trouble';
  }
}

/**
 * 8.5 Objective health (Active objectives)
 */
export function calculateObjectiveHealth(
  objectiveProgress: number,
  expectedPercent: number
): ObjectiveHealth {
  const gap = objectiveProgress - expectedPercent;
  if (gap >= -10) {
    return 'On Track';
  } else if (gap >= -25) {
    return 'At Risk';
  } else {
    return 'In Trouble';
  }
}

/**
 * 4.2 Delayed KR check
 * today > targetDate && achievement < 100
 */
export function isKRDelayed(
  targetDateStr: string,
  achievementPercent: number,
  asOfDateStr: string
): boolean {
  if (achievementPercent >= 100) return false;
  const target = new Date(targetDateStr).getTime();
  const asOf = new Date(asOfDateStr).getTime();
  return asOf > target;
}

/**
 * 8.6 Weightage validations
 */
export function validateKRWeightages(weightages: number[]): {
  valid: boolean;
  total: number;
  message?: string;
} {
  const total = weightages.reduce((sum, w) => sum + (Number(w) || 0), 0);
  const rounded = Math.round(total * 100) / 100;
  if (rounded === 100) {
    return { valid: true, total: rounded };
  }
  return {
    valid: false,
    total: rounded,
    message: `KR weightages must total 100. Currently ${rounded}.`,
  };
}

/**
 * 12.2 Forecast Linear Regression
 * Given measurements { measuredAt, value }, fit a straight line and project at targetDate.
 */
export function calculateKRForecast(
  measurements: { measuredAt: string; value: number }[],
  targetDateStr: string,
  baseline: number,
  target: number,
  direction: KRDirection
): { projectedValue: number; projectedPercent: number; message: string; onPace: boolean } | null {
  if (!measurements || measurements.length < 3) return null;

  // Sort by date ascending
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
  );

  const t0 = new Date(sorted[0].measuredAt).getTime();
  const points = sorted.map((m) => ({
    x: (new Date(m.measuredAt).getTime() - t0) / (1000 * 60 * 60 * 24), // days
    y: m.value,
  }));

  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const targetDays = (new Date(targetDateStr).getTime() - t0) / (1000 * 60 * 60 * 24);
  const projectedVal = slope * targetDays + intercept;
  const projectedPct = calculateKRAchievement(direction, baseline, target, projectedVal);

  const targetDateObj = new Date(targetDateStr);
  const formattedDate = targetDateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  const onPace = projectedPct >= 100;
  const message = `At this pace you will reach ${projectedPct}% by ${formattedDate}`;

  return {
    projectedValue: Math.round(projectedVal * 100) / 100,
    projectedPercent: projectedPct,
    message,
    onPace,
  };
}

/**
 * Format currency with Indian number formatting: ₹5,00,000
 */
export function formatIndianCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

/**
 * Format numbers with Indian system or decimals
 */
export function formatValueWithUnit(
  value: number,
  typeName: string,
  symbol?: string
): string {
  if (typeName === 'Currency' || symbol === '₹') {
    return formatIndianCurrency(value);
  }
  if (typeName === 'Percentage' || symbol === '%') {
    return `${value}%`;
  }
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Profit.co Plan Value Calculation
 * Calculates the expected/planned milestone value at any given date along the trajectory.
 */
export function calculatePlannedValue(
  startDateStr: string,
  targetDateStr: string,
  baseline: number,
  target: number,
  asOfDateStr: string
): number {
  const start = new Date(startDateStr).getTime();
  const end = new Date(targetDateStr).getTime();
  const current = new Date(asOfDateStr).getTime();

  if (end <= start) return target;
  if (current <= start) return baseline;
  if (current >= end) return target;

  const fraction = (current - start) / (end - start);
  const planned = baseline + (target - baseline) * fraction;
  return Math.round(planned * 10) / 10;
}

export interface CheckInEvaluationResult {
  health: KRStatus;
  statusText: string;
  delta: number;
  percentageDelta: number;
  bannerText: string;
  isPositive: boolean;
}

/**
 * Profit.co Check-in Health and Dynamic Feedback Banner Evaluator
 * Formats the exact string and status badge shown in the friend's company application.
 */
export function evaluateCheckInHealth(
  direction: KRDirection,
  baseline: number,
  target: number,
  planValue: number,
  actualValue: number
): CheckInEvaluationResult {
  const delta = Math.round((actualValue - planValue) * 10) / 10;
  const baseDenominator = Math.abs(planValue) || 1;
  const percentageDelta = Math.round(((actualValue - planValue) / baseDenominator) * 1000) / 10;

  let isPositive = false;
  let health: KRStatus = 'On Track';
  let bannerText = '';

  if (direction === 'INCREASE') {
    isPositive = actualValue >= planValue;
    if (actualValue >= target) {
      health = 'Completed';
      bannerText = `Status set to Completed: target reached (${actualValue}/${target})!`;
    } else if (actualValue >= planValue) {
      health = 'On Track';
      bannerText = `Status set to On Track: actual ${actualValue} is above the plan of ${planValue} for this date (${Math.abs(percentageDelta)}%). You can override this if needed.`;
    } else if (actualValue <= baseline) {
      health = 'In Trouble';
      bannerText = `Status set to Not Started: actual ${actualValue} is below the plan of ${planValue} for this date (${percentageDelta}%). You can override this if needed.`;
    } else {
      health = 'At Risk';
      bannerText = `Status set to At Risk: actual ${actualValue} is below the plan of ${planValue} for this date (${percentageDelta}%). You can override this if needed.`;
    }
  } else {
    // DECREASE
    isPositive = actualValue <= planValue;
    if (actualValue <= target) {
      health = 'Completed';
      bannerText = `Status set to Completed: target reached (${actualValue}/${target})!`;
    } else if (actualValue <= planValue) {
      health = 'On Track';
      bannerText = `Status set to On Track: actual ${actualValue} is at or below the plan of ${planValue} for this date. You can override this if needed.`;
    } else {
      health = 'At Risk';
      bannerText = `Status set to At Risk: actual ${actualValue} is above the plan of ${planValue} for this date. You can override this if needed.`;
    }
  }

  const statusText = health === 'Completed' ? 'Completed' : `In Progress | ${health}`;

  return {
    health,
    statusText,
    delta,
    percentageDelta,
    bannerText,
    isPositive,
  };
}

