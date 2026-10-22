import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  Bell,
  BellOff,
  Clock3,
  Compass,
  ExternalLink,
  MapPin,
  Navigation2,
  SquareParking,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawerClose, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  milesBetween,
  nearbyRestaurants,
  peopleMoverStations,
  qlineStations,
  restaurants,
  type Place,
  type Station,
  type StationSlot,
} from '@/data/transit';
import { nearbyParking } from '@/data/parking';
import { qlineStatus, qlineStationSchedule } from '@/data/qlineSchedule';
import { stationSchedule } from '@/data/schedule';
import { moverDrawerArrivals } from '@/data/moverDrawerArrivals';
import { getVenueLogo } from '@/components/venueLogo';
import { useAnchorSlots } from '@/hooks/useAnchorSlots';
import { trackSlot } from '@/hooks/trackSlot';
import ArrivalEstimateNote from '@/components/dialogs/ArrivalEstimateNote';

export type StationDrawerProps = {
  station: Station;
  restaurantId: string | null;
  onRestaurant: (id: string) => void;
  isArmed: boolean;
  onArm: () => void;
  onDisarm: () => void;
  /** Scrolls the sponsor card into view, used by the home strip. */
  focusPartner?: boolean;
};

/** The station drawer: timetable, wayfinding, sponsor slots and dining. */
export default function StationDrawer({
  station,
  restaurantId,
  onRestaurant,
  isArmed,
  onArm,
  onDisarm,
  focusPartner = false,
}: StationDrawerProps) {
  const [priceFilter, setPriceFilter] = useState<'all' | '$' | '$$' | '$$$+'>('all');
  const [maxMinutes, setMaxMinutes] = useState<number | 'all'>('all');
  const [lateNightOnly, setLateNightOnly] = useState(false);

  const isQLine = station.line === 'qline';

  const allNearby = useMemo(() => {
    return nearbyRestaurants(station).map((r) => ({
      ...r,
      walkMinutes: Math.max(1, Math.round(r.walkMiles * 20)),
    }));
  }, [station]);

  // Slot architecture: slot 1 is the annual partner, slot 2 rotates.
  // Admin assignments from the partner portal override the built-in slots.
  const slots = useAnchorSlots(station.id);
  const anchorRef = useRef<HTMLDivElement>(null);

  // The home strip opens the drawer straight onto the sponsor card. The
  // drawer slides in first, so the scroll waits until the card is laid out
  // and then sticks.
  useEffect(() => {
    if (!focusPartner) return;
    let frame = 0;
    let attempts = 0;

    const tick = () => {
      const anchor = anchorRef.current;
      const container = anchor?.closest('.detail-content') as HTMLElement | null;
      if (anchor && container) {
        const offset =
          anchor.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop;
        if (offset > 8) {
          container.scrollTo({ top: Math.max(0, offset - 8), behavior: 'instant' });
          if (container.scrollTop > 0) return;
        }
      }
      attempts += 1;
      if (attempts < 90) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [focusPartner, slots.slot1, slots.slot2]);

  const slotPlace = (slot: StationSlot | null): Place | null => {
    if (!slot) return null;
    const place = restaurants.find((r) => r.id === slot.placeId);
    if (place) return place;
    // Slots assigned from the partner portal can point at a new business.
    return {
      id: slot.placeId,
      name: slot.businessName ?? slot.placeId,
      category: 'Station partner',
      price: '',
      url: '',
      coordinate: station.entrance,
    };
  };
  const slot1Place = slotPlace(slots.slot1);
  const slot2Place = slotPlace(slots.slot2);
  const slotWalkMinutes = (place: Place | null): number => {
    if (!place) return 0;
    return Math.max(1, Math.round(milesBetween(station.entrance, place.coordinate) * 1.25 * 20));
  };

  // Filtered standard listings (slot holders are never listed twice)
  const standardSpots = useMemo(() => {
    const slotIds = new Set([slots.slot1?.placeId, slots.slot2?.placeId].filter(Boolean));
    return allNearby
      .filter((r) => !slotIds.has(r.id))
      .filter((r) => {
        if (priceFilter === '$' && r.price !== '$') return false;
        if (priceFilter === '$$' && r.price !== '$$') return false;
        if (priceFilter === '$$$+' && r.price !== '$$$' && r.price !== '$$$$') return false;
        if (maxMinutes !== 'all' && r.walkMinutes > maxMinutes) return false;
        if (lateNightOnly && !r.lateNight) return false;
        return true;
      });
  }, [allNearby, slots, priceFilter, maxMinutes, lateNightOnly]);

  const stationsInLine = isQLine ? qlineStations : peopleMoverStations;
  const number = stationsInLine.findIndex((s) => s.id === station.id) + 1;
  const next = stationsInLine[number % stationsInLine.length] ?? station;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${station.entrance[1]},${station.entrance[0]}`;

  // Garages that connect to this station for a park-once trip.
  const stationParking = useMemo(
    () =>
      nearbyParking(station).map((garage) => ({
        ...garage,
        walkMinutes: Math.max(1, Math.round(garage.walkMiles * 20)),
      })),
    [station],
  );

  // Walk estimate from downtown center (Campus Martius [-83.0466, 42.3316])
  const walkingMiles = milesBetween([-83.0466, 42.3316], station.entrance) * 1.3;
  const walkingMinutes = Math.max(1, Math.round(walkingMiles * 20));

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const sched = stationSchedule(station.id, now);
  const moverArrivals = useMemo(
    () => (isQLine ? [] : moverDrawerArrivals(station.id, now)),
    [isQLine, station.id, now],
  );
  const qline = useMemo(() => qlineStatus(now), [now]);
  const qlineDepartures = useMemo(
    () => (isQLine ? qlineStationSchedule(station.id, now) : []),
    [isQLine, station.id, now],
  );
  // Where the departure times came from: the agency's dated schedule, the daily
  // pattern rolled forward past the end of the feed calendar, or the published
  // hours alone. The operating window itself is always the published hours.
  const qlineSourceLabel =
    qline.window.source === 'feed'
      ? 'departures from agency GTFS'
      : qline.window.source === 'pattern'
        ? 'departures from agency GTFS, rolled forward'
        : 'published hours only';

  return (
    <div className="detail-content station-drawer-v2">
      {/* Header */}
      <DrawerHeader className="detail-heading">
        <div className="drawer-header-top">
          <div className="drawer-eyebrow">
            <span className="signal-dot" /> {isQLine ? 'QLINE' : 'PEOPLE MOVER'}{' '}
            <span className="detail-divider">/</span> STATION {String(number).padStart(2, '0')}
          </div>
          <DrawerClose asChild>
            <button type="button" className="drawer-close-btn" aria-label="Close station drawer">
              <X size={18} />
            </button>
          </DrawerClose>
        </div>
        <div className="station-title-row">
          <DrawerTitle className="station-main-title">{station.name}</DrawerTitle>
          <button
            type="button"
            className={`alarm-toggle-btn ${isArmed ? 'alarm-active' : ''}`}
            onClick={isArmed ? onDisarm : onArm}
            title={isArmed ? 'Cancel stop alert' : 'Alert me when arriving'}
          >
            {isArmed ? <BellOff size={14} /> : <Bell size={14} />}
            <span>{isArmed ? 'ALARM ON' : 'SET ALARM'}</span>
          </button>
        </div>
        <DrawerDescription className="station-sub-location">
          {station.neighborhood}, Detroit · {station.crossStreets}
        </DrawerDescription>
      </DrawerHeader>

      {/* 3-Column Top Stats Grid */}
      <div className="stat-tri-grid">
        <div className="stat-tri-cell">
          <span className="stat-tri-label">WALK FROM CAMPUS MARTIUS*</span>
          <div className="stat-tri-value">
            <span className="stat-tri-accent">{walkingMinutes}</span> min{' '}
            <span className="stat-tri-sub">· ~{walkingMiles.toFixed(1)} mi</span>
          </div>
        </div>
        <div className="stat-tri-cell">
          <span className="stat-tri-label">NEXT STOP</span>
          <div className="stat-tri-next-name">{next.name}</div>
        </div>
        <div className="stat-tri-cell">
          <span className="stat-tri-label">SERVICE NOW</span>
          <div
            className={`stat-tri-status ${(isQLine ? qline.running : sched.running) ? 'is-running' : 'not-running'}`}
          >
            {isQLine
              ? qline.running
                ? 'Running'
                : 'Not running'
              : sched.running
                ? 'Running'
                : 'Not running'}
          </div>
        </div>
      </div>

      {/* Station Wayfinding & Entrance Guide */}
      <div className="wayfinding-card">
        <div className="wayfinding-header">
          <div className="wayfinding-title-group">
            <Accessibility size={16} className="text-cyan-400" />
            <span>STATION WAYFINDING &amp; ENTRANCE GUIDE</span>
          </div>
          <div
            className={`wayfinding-elevator-pill ${station.elevator ? 'elevator-yes' : 'elevator-no'}`}
          >
            {station.elevator ? 'ELEVATOR AVAILABLE' : 'STAIRS / RAMP'}
          </div>
        </div>

        <p className="wayfinding-body-text">{station.entranceNotes}</p>

        <div className="wayfinding-meta-row">
          <span className="wayfinding-meta-tag">CROSS STREETS:</span>
          <span className="wayfinding-meta-val">{station.crossStreets}</span>
        </div>

        <div className="wayfinding-meta-row">
          <span className="wayfinding-meta-tag">ADA STATUS:</span>
          <span className="wayfinding-meta-val">
            {station.adaCompliant ? 'Fully Accessible' : 'Limited Access / Check Elevator'}
          </span>
        </div>
      </div>

      {/* Scheduled Timetable Section */}
      <div className="timetable-section">
        <div className="timetable-header">
          <span className="timetable-heading">
            {isQLine || !sched.running ? 'NEXT TRAINS · SCHEDULED' : 'NEXT TRAINS · ESTIMATED'}
          </span>
          {isQLine || !sched.running ? <span className="timetable-subheading">OFFICIAL TIMETABLE</span> : <ArrivalEstimateNote />}
        </div>

        {isQLine ? (
          qlineDepartures.length > 0 ? (
            <div className="timetable-rows">
              {qlineDepartures.map((departure, index) => (
                <div key={`${departure.seconds}-${index}`} className="timetable-row">
                  <div className="timetable-clock-box">
                    <Clock3 size={18} />
                  </div>
                  <div className="timetable-time-col">
                    <div className="timetable-primary-time">{departure.time}</div>
                    <div className="timetable-day-note">
                      {departure.minutes <= 0
                        ? 'Due at platform'
                        : departure.minutes <= 15
                          ? `In ~${departure.minutes} min · ${departure.label}`
                          : departure.label}
                    </div>
                  </div>
                  {departure.minutes > 0 && departure.minutes <= 10 && (
                    <span className="timetable-pill-due">APPROACHING</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="timetable-rows">
              <div className="timetable-row">
                <div className="timetable-clock-box">
                  <Clock3 size={18} />
                </div>
                <div className="timetable-time-col">
                  <div className="timetable-primary-time">
                    {qline.running ? qline.label : 'Service Closed'}
                  </div>
                  <div className="timetable-day-note">
                    {qline.running
                      ? qline.nextDepartureLabel
                      : `${qline.nextDepartureLabel} · ${qline.window.opensAt} to ${qline.window.closesAt}`}
                  </div>
                </div>
                <div className="timetable-status-tag">{qline.running ? 'ACTIVE' : 'CLOSED'}</div>
              </div>
              <div className="timetable-row">
                <div className="timetable-clock-box">
                  <Clock3 size={18} />
                </div>
                <div className="timetable-time-col">
                  <div className="timetable-primary-time">
                    {qline.window.opensAt} to {qline.window.closesAt}
                  </div>
                  <div className="timetable-day-note">
                    {qline.window.isSunday
                      ? 'Sunday service hours'
                      : 'Monday to Saturday service hours'}
                    {' · '}
                    {qlineSourceLabel}
                  </div>
                </div>
                <div className="timetable-status-tag">FREE</div>
              </div>
            </div>
          )
        ) : moverArrivals.length > 0 ? (
          <div className="timetable-rows">
            {moverArrivals.map((train, i) => (
              <div key={i} className="timetable-row">
                <div className="timetable-clock-box">
                  <Clock3 size={18} />
                </div>
                <div className="timetable-time-col">
                  <div className="timetable-primary-time">{train.time}</div>
                  <div className="timetable-day-note">
                    {train.note}
                  </div>
                </div>
                {train.minutes > 0 && train.minutes <= 10 && (
                  <span className="timetable-pill-due">APPROACHING</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="timetable-empty">
            {sched.running
              ? 'Service ending · No further estimates available.'
              : 'No upcoming service in the current timetable.'}
          </div>
        )}
      </div>

      {/* Station Anchor & Dining Section */}
      <div className="dining-block">
        <div className="dining-section-header">
          <span className="dining-section-title">STATION ANCHOR &amp; DINING</span>
          <a href="/pricing" className="dining-section-link">
            LOCAL HUBS <ExternalLink size={12} />
          </a>
        </div>

        <div className="anchor-slots" ref={anchorRef}>
          {/* Slot 1 — annual partner */}
          {slot1Place && slots.slot1 ? (
            <SponsorSlotCard
              slot={slots.slot1}
              place={slot1Place}
              walkMinutes={slotWalkMinutes(slot1Place)}
              onRestaurant={onRestaurant}
              isPinned={restaurantId === slot1Place.id}
            />
          ) : (
            <OpenSlotCard slot={1} stationName={station.name} stationId={station.id} />
          )}

          {/* Slot 2 — rotating partner */}
          {slot2Place && slots.slot2 ? (
            <SponsorSlotCard
              slot={slots.slot2}
              place={slot2Place}
              walkMinutes={slotWalkMinutes(slot2Place)}
              onRestaurant={onRestaurant}
              isPinned={restaurantId === slot2Place.id}
            />
          ) : (
            <OpenSlotCard slot={2} stationName={station.name} stationId={station.id} />
          )}
        </div>

        {/* Filter Bar */}
        <div className="filters-strip">
          <div className="filter-group">
            <span className="filter-title">PRICE:</span>
            {(['all', '$', '$$', '$$$+'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`filter-button ${priceFilter === p ? 'selected' : ''}`}
                onClick={() => setPriceFilter(p)}
              >
                {p === 'all' ? 'ALL' : p}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-title">WALK:</span>
            {(
              [
                ['all', 'ANY'],
                [5, '≤5M'],
                [10, '≤10M'],
              ] as const
            ).map(([val, lbl]) => (
              <button
                key={String(val)}
                type="button"
                className={`filter-button ${maxMinutes === val ? 'selected' : ''}`}
                onClick={() => setMaxMinutes(val as number | 'all')}
              >
                {lbl}
              </button>
            ))}
            <button
              type="button"
              className={`filter-button ${lateNightOnly ? 'selected-warm' : ''}`}
              onClick={() => setLateNightOnly((v) => !v)}
            >
              LATE NIGHT
            </button>
          </div>
        </div>

        {/* Restaurants List */}
        {standardSpots.length > 0 ? (
          <div className="restaurants-scroll-list">
            {standardSpots.map((r) => (
              <div
                key={r.id}
                className={`restaurant-row-card ${restaurantId === r.id ? 'is-selected' : ''}`}
                onClick={() => onRestaurant(r.id)}
              >
                <div className="restaurant-thumb-box">
                  {getVenueLogo(r) ? (
                    <img src={getVenueLogo(r) ?? ''} alt={r.name} loading="lazy" />
                  ) : (
                    <MapPin size={18} />
                  )}
                </div>
                <div className="restaurant-info-box">
                  <div className="restaurant-name-header">
                    <span className="restaurant-name">{r.name}</span>
                  </div>
                  <div className="restaurant-meta-line">
                    {r.category} · {r.walkMiles.toFixed(2)} mi · ~{r.walkMinutes} min walk
                    {r.lateNight && <span className="restaurant-late-tag"> · Late Night</span>}
                  </div>
                </div>
                <div className="restaurant-actions-box">
                  <span className="restaurant-price-indicator">{r.price}</span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="restaurant-external-link"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open ${r.name} menu`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-search">No spots match the selected filters.</div>
        )}

        {/* Park once garages connected to this station */}
        {stationParking.length > 0 && (
          <div className="dining-block">
            <div className="dining-section-header">
              <span className="dining-section-title">PARK ONCE · NEARBY GARAGES</span>
            </div>
            <div className="restaurants-scroll-list">
              {stationParking.map((garage) => (
                <div key={garage.id} className="restaurant-row-card">
                  <div className="restaurant-thumb-box">
                    <SquareParking size={18} />
                  </div>
                  <div className="restaurant-info-box">
                    <div className="restaurant-name-header">
                      <span className="restaurant-name">{garage.name}</span>
                    </div>
                    <div className="restaurant-meta-line">
                      {garage.address} · ~{garage.walkMinutes} min walk ·{' '}
                      {garage.line === 'mover' ? 'DPM' : 'QLINE'}
                    </div>
                    <div className="restaurant-meta-line">{garage.hours}</div>
                  </div>
                  <div className="restaurant-actions-box">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${garage.coordinate[1]},${garage.coordinate[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="restaurant-external-link"
                      aria-label={`Open ${garage.name} in maps`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="restaurant-meta-line" style={{ marginTop: '0.5rem' }}>
              Rates and hours vary — confirm with the garage on arrival.
            </div>
          </div>
        )}

        {/* Directions & Footer */}
        <div className="station-actions-row">
          <Button variant="hudActive" asChild className="directions-cta-btn">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation2 size={16} /> WALKING DIRECTIONS <ExternalLink size={13} />
            </a>
          </Button>
          <div className="coordinates-label">
            <Compass size={14} />
            {station.coordinate[1].toFixed(4)}° N, {Math.abs(station.coordinate[0]).toFixed(4)}° W
          </div>
        </div>
      </div>

      <div className="detail-disclaimer">
        <Clock3 size={13} /> {isQLine
          ? 'Arrivals calculated from published headway schedules.'
          : 'First arrival follows the simulated fleet. The second is a 15–20 minute planning window, not a confirmed departure.'}{' '}
        Real-time agency telemetry currently unavailable from DTC. Vehicle markers are simulated.
      </div>
    </div>
  );
}

function SponsorSlotCard({
  slot,
  place,
  walkMinutes,
  onRestaurant,
  isPinned,
}: {
  slot: StationSlot;
  place: Place;
  walkMinutes: number;
  onRestaurant: (id: string) => void;
  isPinned: boolean;
}) {
  const thumb = getVenueLogo(place);
  useEffect(() => {
    trackSlot(slot.stationId, slot.slot, 'view');
  }, [slot.stationId, slot.slot]);
  return (
    <div className="anchor-spot-wrapper">
      <div className="anchor-spot-eyebrow">
        <span className="anchor-spot-dot" /> SLOT {slot.slot} ·{' '}
        {slot.kind === 'annual'
          ? 'ANNUAL PARTNER'
          : `ROTATING PARTNER${slot.rotation ? ` · ${slot.rotation}` : ''}`}
      </div>
      <div className="anchor-spot-box">
        <div className="anchor-spot-top">
          <div className="anchor-spot-thumb">
            {thumb ? <img src={thumb} alt={place.name} loading="lazy" /> : <MapPin size={22} />}
          </div>
          <div className="anchor-spot-info">
            <div className="anchor-spot-name-row">
              <h3 className="anchor-spot-name">{place.name}</h3>
              <span className="anchor-spot-price">{place.price}</span>
            </div>
            <div className="anchor-spot-meta">
              {place.category} · ~{walkMinutes} min walk
            </div>
            <div className="anchor-spot-partner-tag">{slot.tagline}</div>
          </div>
        </div>

        {slot.perk && (
          <div className="anchor-perk-container">
            <div className="anchor-perk-label">RIDER PERK:</div>
            <div className="anchor-perk-body">{slot.perk}</div>
          </div>
        )}

        <div className="anchor-btn-grid">
          <button
            type="button"
            className={`anchor-action-btn ${isPinned ? 'active' : ''}`}
            onClick={() => {
              if (!isPinned) trackSlot(slot.stationId, slot.slot, 'map');
              onRestaurant(place.id);
            }}
          >
            <MapPin size={14} />
            <span>{isPinned ? 'UNTOGGLE 3D PIN' : 'SHOW ON 3D MAP'}</span>
          </button>
          {place.url && (
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor-action-btn anchor-action-visit"
              onClick={() => trackSlot(slot.stationId, slot.slot, 'visit')}
            >
              <span>MENU &amp; VISIT</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function OpenSlotCard({
  slot,
  stationName,
  stationId,
}: {
  slot: 1 | 2;
  stationName: string;
  stationId: string;
}) {
  const annual = slot === 1;
  return (
    <div className="unclaimed-anchor-banner">
      <div>
        <div className="unclaimed-title">
          ★ {annual ? 'CLAIM THE ANNUAL SLOT' : 'CLAIM THE ROTATING SLOT'}
        </div>
        <p className="unclaimed-text">
          {annual
            ? `Lock in the exclusive top spot at ${stationName} for a full year.`
            : `Feature at ${stationName} for one rotation window, then pass it on.`}
        </p>
      </div>
      <a
        href={`/partner?slot=${slot}&station=${stationId}&name=${encodeURIComponent(stationName)}`}
        className="unclaimed-btn"
      >
        CLAIM SLOT {slot} <ExternalLink size={12} />
      </a>
    </div>
  );
}
