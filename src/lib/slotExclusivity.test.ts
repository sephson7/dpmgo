import { describe, expect, it } from 'vitest';
import { activeExclusiveHold, termEndForPlan } from '@/lib/slotExclusivity';

const annual = {
  stationId: 'times-square',
  slot: 1 as const,
  kind: 'annual' as const,
  assignedAt: '2026-01-15T12:00:00.000Z',
};

describe('exclusive annual term', () => {
  it('blocks the slot for 12 months after approval', () => {
    expect(activeExclusiveHold([annual], 'times-square', 1, new Date('2026-12-01'))).not.toBeNull();
  });
  it('releases the slot once the 12 months end', () => {
    expect(activeExclusiveHold([annual], 'times-square', 1, new Date('2027-01-16'))).toBeNull();
  });
  it('does not block other slots or stations', () => {
    const now = new Date('2026-06-01');
    expect(activeExclusiveHold([annual], 'times-square', 2, now)).toBeNull();
    expect(activeExclusiveHold([annual], 'bricktown', 1, now)).toBeNull();
  });
  it('does not protect a monthly rotating placement', () => {
    const monthly = { ...annual, slot: 2 as const, kind: 'rotating' as const };
    expect(activeExclusiveHold([monthly], 'times-square', 2, new Date('2026-02-01'))).toBeNull();
    expect(termEndForPlan('monthly', new Date())).toBeUndefined();
  });
  it('protects an annual slot 2 purchase through its recorded term end', () => {
    const slot2 = {
      ...annual,
      slot: 2 as const,
      kind: 'rotating' as const,
      termEndsAt: termEndForPlan('annual', new Date('2026-01-15T12:00:00.000Z')) ?? '',
    };
    expect(activeExclusiveHold([slot2], 'times-square', 2, new Date('2026-09-01'))).not.toBeNull();
  });
});
