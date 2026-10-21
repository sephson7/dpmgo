import { Bell, Compass, Flag, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  canadaTransitGuide,
  milesBetween,
  popularHotels,
  peopleMoverStations,
  qlineStations,
  type DestinationShortcut,
  type HowDoIFlow,
  type HotelGuide,
  type TransitRoutePlan,
} from '@/data/transit';

export type QuickNavDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeShortcut: DestinationShortcut | null;
  activeHowDoI: HowDoIFlow | null;
  /** The computed itinerary between the boarding station and the destination. */
  route: TransitRoutePlan;
  selectedHotel: HotelGuide;
  onSelectHotel: (hotel: HotelGuide) => void;
  /** The rider's location, when the device has one. */
  userPosition: [number, number] | null;
  /** The station the rider boards at, or null to use the nearest one. */
  manualOriginId: string | null;
  onSelectOrigin: (stationId: string | null) => void;
  /** Arms the stop alarm for the destination. */
  onArmAlarm: () => void;
  /** Flies the camera to the destination. */
  onFlyToDestination: () => void;
};

/** The step by step itinerary for a preset route. */
export default function QuickNavDialog({
  open,
  onOpenChange,
  activeShortcut,
  activeHowDoI,
  route,
  selectedHotel,
  onSelectHotel,
  userPosition,
  manualOriginId,
  onSelectOrigin,
  onArmAlarm,
  onFlyToDestination,
}: QuickNavDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="quick-nav-dialog">
        <div className="quick-nav-header">
          <div className="quick-nav-badge">
            <Compass size={12} />
            <span>
              {activeHowDoI ? activeHowDoI.badge : activeShortcut?.category?.toUpperCase()}
            </span>
          </div>
          <DialogTitle className="quick-nav-title">{route.destinationHubName}</DialogTitle>
          <DialogDescription className="quick-nav-subtitle">
            {activeShortcut?.description ||
              (activeHowDoI?.id === 'hotel'
                ? 'Guided transit & walking directions back to your downtown hotel room.'
                : activeHowDoI?.id === 'canada'
                  ? 'Official cross-border tunnel bus connection between Detroit and Windsor, Ontario.'
                  : activeHowDoI?.shortDesc)}
          </DialogDescription>
        </div>

        {/* Hotel Selector if Hotel Flow */}
        {activeHowDoI?.id === 'hotel' && (
          <div className="quick-nav-hotel-selector">
            <label htmlFor="hotel-select" className="quick-nav-field-label">
              SELECT YOUR HOTEL:
            </label>
            <select
              id="hotel-select"
              value={selectedHotel.id}
              onChange={(e) => {
                const hotel = popularHotels.find((h) => h.id === e.target.value);
                if (hotel) onSelectHotel(hotel);
              }}
              className="quick-nav-dropdown"
            >
              {popularHotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.address})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Canada Cross-Border Transit Notice */}
        {activeHowDoI?.id === 'canada' && (
          <div className="canada-travel-banner">
            <div className="canada-banner-header">
              <Flag size={14} className="text-red-400" />
              <strong>INTERNATIONAL CROSS-BORDER TRANSIT</strong>
            </div>
            <p className="canada-banner-desc">
              The <strong>Transit Windsor Tunnel Bus</strong> departs from the Mariners’ Church
              Tunnel Plaza (170 E Jefferson Ave), just 1 block from Financial District / Millender
              Center Stations.
            </p>
            <div className="canada-requirements-grid">
              <div>
                <span className="req-label">REQUIRED DOCUMENTS:</span>
                <ul className="req-list">
                  {canadaTransitGuide.documentRequirements.map((req, idx) => (
                    <li key={idx}>✓ {req}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="req-label">FARES &amp; PAYMENT:</span>
                <p className="req-text">
                  {canadaTransitGuide.fareCAD} · {canadaTransitGuide.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FLEXIBLE BOARDING LOGIC SELECTOR */}
        <div className="quick-nav-boarding-box">
          <div className="quick-nav-boarding-header">
            <span className="boarding-label">BOARDING STATION (STARTING POINT):</span>
            <span className="boarding-mode-tag">
              {userPosition && !manualOriginId ? '📍 AUTO-DETECTED (GPS)' : 'MANUAL'}
            </span>
          </div>
          <select
            value={manualOriginId ?? '__auto__'}
            onChange={(e) => onSelectOrigin(e.target.value === '__auto__' ? null : e.target.value)}
            className="quick-nav-dropdown"
          >
            <option value="__auto__">
              {userPosition ? '📍 Nearest to me' : 'Auto'} — {route.originStation.name}
            </option>
            <optgroup label="People Mover Loop Stations">
              {peopleMoverStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{' '}
                  {userPosition && milesBetween(userPosition, s.coordinate) < 0.25
                    ? '(Near You)'
                    : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="QLINE Woodward Streetcar">
              {qlineStations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Woodward Ave)
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* STEP-BY-STEP ROUTE ITINERARY */}
        <div className="quick-nav-steps">
          {/* Step 1: Boarding */}
          <div className="route-step">
            <div className="route-step-indicator">1</div>
            <div className="route-step-content">
              <div className="route-step-title">
                Board at <strong>{route.originStation.name}</strong>
              </div>
              <div className="route-step-note">
                {route.line === 'mover' ? (
                  <span className="line-chip mover">Detroit People Mover (Elevated Loop)</span>
                ) : (
                  <span className="line-chip qline">QLINE Woodward Streetcar</span>
                )}
                <span className="free-fare-badge">100% FREE FARE</span>
              </div>
            </div>
          </div>

          {/* Step 2: Transit Ride */}
          <div className="route-step">
            <div className="route-step-indicator">2</div>
            <div className="route-step-content">
              {route.stopsCount === 0 ? (
                <div className="route-step-title">
                  Already at <strong>{route.destinationStation.name}</strong>
                </div>
              ) : (
                <div className="route-step-title">
                  Ride{' '}
                  <strong>
                    {route.stopsCount} stop{route.stopsCount === 1 ? '' : 's'}
                  </strong>{' '}
                  (~{route.estimatedRideMinutes} mins)
                </div>
              )}
              {route.legs.map((leg) => (
                <div className="intermediate-stops" key={`leg-${leg.line}-${leg.toStation.id}`}>
                  {leg.line === 'mover' ? 'People Mover' : 'QLINE'}
                  {leg.intermediateStations.length > 0
                    ? ` passing ${leg.intermediateStations.join(' → ')}`
                    : ` direct to ${leg.toStation.name}`}
                </div>
              ))}
              {route.transferStation && (
                <div className="route-step-note">
                  Transfer at <strong>{route.transferStation.name}</strong> — walk ~
                  {route.transferWalkMinutes} min to the{' '}
                  {route.legs[1]?.line === 'qline' ? 'QLINE' : 'People Mover'} platform.
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Exit Station */}
          <div className="route-step">
            <div className="route-step-indicator">3</div>
            <div className="route-step-content">
              <div className="route-step-title">
                Exit at <strong>{route.destinationStation.name}</strong>
              </div>
              <div className="route-step-note">
                {route.destinationStation.entranceNotes ||
                  'Take elevator or platform stairs down to street level.'}
              </div>
            </div>
          </div>

          {/* Step 4: Walking */}
          <div className="route-step">
            <div className="route-step-indicator">4</div>
            <div className="route-step-content">
              <div className="route-step-title">
                <Footprints size={14} className="inline mr-1 text-cyan-400" />
                Walk {route.walkingDistanceMiles} mi (~{route.walkingMinutes} min) to{' '}
                {route.destinationHubName}
              </div>
              <div className="route-step-note">{route.walkingDirections}</div>
            </div>
          </div>
        </div>

        {/* ACTIONS: 3D MAP FLYTO & ALARM */}
        <div className="quick-nav-actions">
          <Button
            variant="hudOutline"
            className="quick-nav-action-btn map-btn"
            onClick={onFlyToDestination}
          >
            <Compass size={14} />
            <span>FLY TO 3D MAP</span>
          </Button>

          <Button variant="default" className="quick-nav-action-btn alarm-btn" onClick={onArmAlarm}>
            <Bell size={14} />
            <span>NOTIFY ON ARRIVAL</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
