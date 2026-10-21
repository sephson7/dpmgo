import { useEffect, useMemo, useState } from 'react';
import { restaurants, stationSlotAssignments, type StationSlot } from '@/data/transit';

/**
 * The partner slot assignments published by the partner portal. The request
 * is shared, so the home strip and the station drawer cost one call between
 * them.
 */
let pending: Promise<StationSlot[]> | null = null;

export function loadAnchorAssignments(): Promise<StationSlot[]> {
  if (!pending) {
    pending = fetch('/api/anchor-slots')
      .then((response) => (response.ok ? response.json() : { assignments: [] }))
      .then((result: { assignments?: StationSlot[] }) => result.assignments ?? [])
      .catch(() => [] as StationSlot[]);
  }
  return pending;
}

export type ResolvedSlots = {
  slot1: StationSlot | null;
  slot2: StationSlot | null;
};

/**
 * The name a partner slot shows: the name the partner gave in the portal, or
 * the name of the venue that holds the built-in slot.
 */
export function slotDisplayName(slot: StationSlot): string {
  if (slot.businessName) return slot.businessName;
  return restaurants.find((r) => r.id === slot.placeId)?.name ?? slot.placeId;
}

/**
 * The two sponsor slots of a station. An assignment made in the partner
 * portal wins over the built-in registry.
 */
export function useAnchorSlots(stationId: string): ResolvedSlots {
  const [assignments, setAssignments] = useState<StationSlot[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadAnchorAssignments().then((list) => {
      if (!cancelled) setAssignments(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const builtIn = stationSlotAssignments(stationId);
    const override = (slot: 1 | 2): StationSlot | null =>
      assignments.find((item) => item.stationId === stationId && item.slot === slot) ?? null;
    return {
      slot1: override(1) ?? builtIn.slot1,
      slot2: override(2) ?? builtIn.slot2,
    };
  }, [stationId, assignments]);
}
