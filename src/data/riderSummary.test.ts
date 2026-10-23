import { describe, expect, it } from 'vitest';
import { riderSummaryStats } from './riderSummary';

describe('station rider summaries', () => {
  it('does not publish percentages for fewer than five definite reports', () => {
    expect(
      riderSummaryStats({ report_day: '2026-10-23', yes_count: 4, no_count: 0, unsure_count: 50 }),
    ).toBeNull();
    expect(riderSummaryStats(null)).toBeNull();
  });
  it('excludes unsure answers from on-time self-report percentages', () => {
    expect(
      riderSummaryStats({ report_day: '2026-10-23', yes_count: 8, no_count: 2, unsure_count: 5 }),
    ).toEqual({ definite: 10, unsure: 5, percent: 80 });
  });
  it('rejects invalid report counts', () => {
    expect(
      riderSummaryStats({ report_day: '2026-10-23', yes_count: -1, no_count: 10, unsure_count: 0 }),
    ).toBeNull();
  });
});
