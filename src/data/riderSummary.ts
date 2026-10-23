export type RiderSummary = {
  report_day: string;
  yes_count: number;
  no_count: number;
  unsure_count: number;
};

/** Self-reported agreement with estimates, never verified transit performance. */
export function riderSummaryStats(summary: RiderSummary | null) {
  if (!summary) return null;
  const counts = [summary.yes_count, summary.no_count, summary.unsure_count];
  if (counts.some((count) => !Number.isSafeInteger(count) || count < 0)) return null;
  const definite = summary.yes_count + summary.no_count;
  if (definite < 5) return null;
  return {
    definite,
    unsure: summary.unsure_count,
    percent: Math.round((summary.yes_count / definite) * 100),
  };
}
