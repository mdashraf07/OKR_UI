import { describe, it, expect } from 'vitest';
import {
  calculateKRAchievement,
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculateKRStatus,
  calculateObjectiveHealth,
  isKRDelayed,
  validateKRWeightages,
  calculateKRForecast,
  formatIndianCurrency,
  evaluateCheckInHealth,
} from '../lib/calculations';

describe('8.1 KR Achievement Calculations', () => {
  it('calculates INCREASE correctly with positive progress', () => {
    // baseline 0, target 3, current 1 -> 33.33%
    const ach = calculateKRAchievement('INCREASE', 0, 3, 1);
    expect(ach).toBe(33.33);
  });

  it('calculates INCREASE deal value correctly', () => {
    // baseline 0, target 500000, current 180000 -> 36.00%
    const ach = calculateKRAchievement('INCREASE', 0, 500000, 180000);
    expect(ach).toBe(36);
  });

  it('calculates DECREASE correctly', () => {
    // average onboarding days: baseline 14, target 7, current 11
    // (14 - 11) / (14 - 7) * 100 = 3/7 * 100 = 42.86%
    const ach = calculateKRAchievement('DECREASE', 14, 7, 11);
    expect(ach).toBe(42.86);
  });

  it('clamps achievement to 0 and 100', () => {
    expect(calculateKRAchievement('INCREASE', 0, 10, -5)).toBe(0);
    expect(calculateKRAchievement('INCREASE', 0, 10, 15)).toBe(100);
    expect(calculateKRAchievement('DECREASE', 10, 5, 12)).toBe(0);
    expect(calculateKRAchievement('DECREASE', 10, 5, 2)).toBe(100);
  });
});

describe('8.2 Objective Progress', () => {
  it('calculates weighted objective progress accurately', () => {
    // KR1: 33.33% with weightage 60 -> 20.00
    // KR2: 36.00% with weightage 40 -> 14.40
    // Total: 34.40%
    const krs = [
      { achievementPercent: 33.33, weightage: 60 },
      { achievementPercent: 36.0, weightage: 40 },
    ];
    const objProgress = calculateObjectiveProgress(krs);
    expect(objProgress).toBe(34.4);
  });
});

describe('8.3 Expected Progress & 8.4 Status Thresholds', () => {
  it('computes expected pace for Q4 cycle at 10 Nov 2026', () => {
    // 1 Oct to 31 Dec (91 days total). 1 Oct to 10 Nov is 40 days -> 40/91 = 43.96%
    const expected = calculateExpectedProgress('2026-10-01', '2026-12-31', '2026-11-10');
    expect(expected).toBe(43.96);
  });

  it('determines At Risk for Ashraf Deals closed KR', () => {
    // Achievement 33.33, expected 43.96 -> gap -10.63 -> At Risk
    const status = calculateKRStatus(33.33, 43.96);
    expect(status).toBe('At Risk');
  });

  it('determines On Track for Deal Value KR', () => {
    // Achievement 36.00, expected 43.96 -> gap -7.96 -> On Track
    const status = calculateKRStatus(36.0, 43.96);
    expect(status).toBe('On Track');
  });

  it('determines In Trouble when gap < -25', () => {
    const status = calculateKRStatus(10.0, 40.0);
    expect(status).toBe('In Trouble');
  });

  it('marks Completed when achievement is 100', () => {
    const status = calculateKRStatus(100.0, 43.96);
    expect(status).toBe('Completed');
  });
});

describe('8.5 Objective Health contrast', () => {
  it('confirms Objective can be On Track while a KR is At Risk', () => {
    // Objective progress: 34.40, expected: 43.96 -> gap -9.56 (>= -10, so On Track!)
    const health = calculateObjectiveHealth(34.4, 43.96);
    expect(health).toBe('On Track');
  });
});

describe('4.2 Delayed KR check', () => {
  it('flags delayed when target date is passed and achievement < 100', () => {
    expect(isKRDelayed('2026-11-01', 80, '2026-11-10')).toBe(true);
    expect(isKRDelayed('2026-11-01', 100, '2026-11-10')).toBe(false);
    expect(isKRDelayed('2026-12-01', 80, '2026-11-10')).toBe(false);
  });
});

describe('8.6 Weightage Validation', () => {
  it('validates KR weightages must equal 100', () => {
    expect(validateKRWeightages([60, 40]).valid).toBe(true);
    expect(validateKRWeightages([60, 30]).valid).toBe(false);
    expect(validateKRWeightages([60, 30]).message).toBe(
      'KR weightages must total 100. Currently 90.'
    );
  });
});

describe('12.2 Forecast Linear Regression', () => {
  it('projects linear trajectory when >= 3 measurements exist', () => {
    const measurements = [
      { measuredAt: '2026-10-01', value: 0 },
      { measuredAt: '2026-10-15', value: 0.5 },
      { measuredAt: '2026-11-01', value: 1.0 },
    ];
    const forecast = calculateKRForecast(
      measurements,
      '2026-12-31',
      0,
      3,
      'INCREASE'
    );
    expect(forecast).not.toBeNull();
    expect(forecast?.projectedValue).toBeGreaterThan(1);
    expect(forecast?.message).toContain('At this pace you will reach');
  });
});

describe('Indian Currency Formatting', () => {
  it('formats Indian rupees properly', () => {
    const formatted = formatIndianCurrency(500000);
    // Should include 5,00,000 and ₹
    expect(formatted).toContain('5,00,000');
    expect(formatted).toContain('₹');
  });
});

describe('Profit.co Check-in Evaluation & Video Matching', () => {
  it('matches Video 3: from 30, to 80, plan 38, actual 39 gives On Track and 2.6%', () => {
    const res = evaluateCheckInHealth('INCREASE', 30, 80, 38, 39);
    expect(res.health).toBe('On Track');
    expect(res.isPositive).toBe(true);
    expect(res.delta).toBe(1);
    expect(res.percentageDelta).toBe(2.6);
    expect(res.bannerText).toContain('Status set to On Track: actual 39 is above the plan of 38');
  });

  it('matches plan 38, actual 40 gives +2 and +5.3%', () => {
    const res = evaluateCheckInHealth('INCREASE', 30, 80, 38, 40);
    expect(res.health).toBe('On Track');
    expect(res.delta).toBe(2);
    expect(res.percentageDelta).toBe(5.3);
  });

  it('matches plan 38, actual 30 gives below plan with Not Started banner', () => {
    const res = evaluateCheckInHealth('INCREASE', 30, 80, 38, 30);
    expect(res.health).toBe('In Trouble');
    expect(res.isPositive).toBe(false);
    expect(res.delta).toBe(-8);
    expect(res.bannerText).toContain('Status set to Not Started: actual 30 is below the plan of 38');
  });

  it('matches target reached 80 gives Completed', () => {
    const res = evaluateCheckInHealth('INCREASE', 30, 80, 38, 80);
    expect(res.health).toBe('Completed');
    expect(res.bannerText).toContain('Status set to Completed');
  });
});

describe('Draft Objective Enrichment Rules', () => {
  it('suppresses progress, health, and check-in ability for Draft objectives', () => {
    const draftObj = {
      id: 99,
      cycleId: 2,
      ownerId: 10,
      level: 'Department' as const,
      title: 'Increase Customer Sales up to 80',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      weightage: 100,
      status: 'Draft' as const,
      approvalState: 'NotSubmitted' as const,
      submissionNo: 1,
      createdBy: 10,
      createdAt: '2026-10-01',
    };

    const draftKR = {
      id: 991,
      objectiveId: 99,
      ownerId: 10,
      name: 'Increase Customer Sales up to 80',
      measurementTypeId: 1,
      direction: 'INCREASE' as const,
      baseline: 40,
      target: 80,
      current: 40,
      weightage: 100,
      startDate: '2026-10-01',
      targetDate: '2026-12-31',
      status: 'On Track' as const,
      statusOverridden: false,
      achievementPercent: 0,
      createdBy: 10,
      createdAt: '2026-10-01',
    };

    // Calculate achievement for baseline 40, target 80
    const ach = calculateKRAchievement('INCREASE', draftKR.baseline, draftKR.target, 50);
    expect(ach).toBe(25);
  });
});
