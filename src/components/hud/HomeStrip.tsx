import { useEffect, useMemo, useState } from 'react';
import { Clock3, Compass, Utensils } from 'lucide-react';
import type { Station } from '@/data/transit';
import type { StationSchedule } from '@/data/schedule';
import { slotDisplayName, useAnchorSlots } from '@/hooks/useAnchorSlots';

/** How long a line stays on screen before the next one fades in. */
const ROTATION_MS = 4500;

type StripItem = {
  key: string;
  /** The category, shown as the kicker on the panel. */
  category: string;
  /** The fact, shown in the panel display row. */
  value: string;
  /** The whole line, shown in the compact phone pill. */
  line: string;
  kind: 'departure' | 'suspended' | 'partner';
};

export type HomeStripProps = {
  /** The station the strip is about, normally the nearest one. */
  station: Station;
  /** The published timetable for that station. */
  schedule: StationSchedule;
  /** Opens the station drawer, scrolled to the partner card for a partner item. */
  onOpenStation: (stationId: string, focusPartner: boolean) => void;
  variant: 'pill' | 'panel';
};

/**
 * The home strip. It rotates through what the rider needs and what the
 * station offers: the next published departure first, then the service state
 * when the line is closed, then the partners whose slot is actually filled.
 * Every item opens the station it refers to.
 */
export default function HomeStrip({ station, schedule, onOpenStation, variant }: HomeStripProps) {
  const slots = useAnchorSlots(station.id);
  const [index, setIndex] = useState(0);

  const items = useMemo<StripItem[]>(() => {
    const name = station.name.toUpperCase();
    const list: StripItem[] = [];
    const next = schedule.trains[0];

    if (schedule.running && next) {
      list.push({
        key: 'departure',
        category: 'NEXT DEPARTURE',
        value: next.time,
        line: `${name} · DEPARTS ${next.time}`,
        kind: 'departure',
      });
    } else {
      list.push({
        key: 'suspended',
        category: 'SERVICE SUSPENDED',
        value: next ? `NEXT RUN ${next.time}` : 'CHECK THE TIMETABLE',
        line: next
          ? `${name} · SERVICE SUSPENDED · NEXT RUN ${next.time}`
          : `${name} · SERVICE SUSPENDED`,
        kind: 'suspended',
      });
    }

    // A partner only appears when its slot is actually filled.
    if (slots.slot1) {
      list.push({
        key: 'partner-1',
        category: 'FEATURED PARTNER',
        value: slotDisplayName(slots.slot1),
        line: `FEATURED AT ${name} · ${slotDisplayName(slots.slot1)}`,
        kind: 'partner',
      });
    }
    if (slots.slot2) {
      list.push({
        key: 'partner-2',
        category: 'ROTATING PARTNER',
        value: slotDisplayName(slots.slot2),
        line: `ROTATING PARTNER AT ${name} · ${slotDisplayName(slots.slot2)}`,
        kind: 'partner',
      });
    }
    return list;
  }, [station.name, schedule, slots]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const item = items[index % items.length] ?? items[0]!;
  const live = schedule.running;
  const open = () => onOpenStation(station.id, item.kind === 'partner');
  const label = `${station.name}. ${item.line}. Open the station.`;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        className="mobile-countdown-pill home-strip"
        onClick={open}
        aria-label={label}
      >
        <span className={`signal-dot ${live ? 'signal-pulse' : 'signal-idle'}`} />
        <span className="mobile-countdown-label home-strip__line" key={item.key}>
          {item.line}
        </span>
      </button>
    );
  }

  return (
    <div className="homepage-ticker-hud home-strip">
      <div className="ticker-hud-header">
        <span className="ticker-hud-kicker">
          <Compass size={11} className={live ? 'text-primary' : 'text-muted-foreground'} />
          NEAREST STATION
        </span>
        <span className="ticker-hud-target">{station.name}</span>
      </div>
      <div className="ticker-hud-display">
        <span className={`ticker-hud-indicator ${live ? 'is-live' : 'is-off'}`} />
        <button
          type="button"
          className="ticker-hud-countdown home-strip__value"
          onClick={open}
          aria-label={label}
        >
          <span className="home-strip__line" key={item.key}>
            {item.kind === 'partner' ? <Utensils size={11} className="home-strip__icon" /> : null}
            {item.kind === 'departure' ? <Clock3 size={11} className="home-strip__icon" /> : null}
            {item.category} <strong>{item.value}</strong>
          </span>
        </button>
      </div>
    </div>
  );
}
