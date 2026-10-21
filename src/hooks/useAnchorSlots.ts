import { useEffect, useMemo, useState } from 'react';
import { restaurants, stationSlotAssignments, type StationSlot } from '@/data/transit';

/**
 * The partner slot assignments published by the partner portal. Concurrent
 * callers share one request, but the result is not cached: a slot approved in
 * the portal has to show up the next time the drawer is opened.
 */
let inflight: Promise<StationSlot[]> | null = null;

export function loadAnchorAssignments(): Promise<StationSlot[]> {
  if (!inflight) {
    const request = fetch('/api/anchor-slots')
      .then((response) => (response.ok ? response.json() : { assignments: [] }))
      .then((result: { assignments?: StationSlot[] }) => result.assignments ?? [])
      .catch(() => [] as StationSlot[])
      .finally(() => {
        if (inflight === request) inflight = null;
      });
    inflight = request;
  }
  return inflight;
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
