import { useMemo } from 'react';
import {
  Building2,
  Car,
  ExternalLink,
  Footprints,
  MapPin,
  Navigation2,
  Train,
  TrainFront,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  venueDestinations,
  parkingStructures,
  peopleMoverStations,
  qlineStops,
  milesBetween,
  type VenueDestination,
  type Coordinate,
} from '@/data/transit';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string | null;
  onVenueSelect: (id: string) => void;
  parkingId: string | null;
  onParkingSelect: (id: string) => void;
  onStationFocus: (id: string) => void;
};

const majorVenueIds = ['ford-field', 'comerica-park', 'lca', 'hart-plaza'];
const majorVenues = venueDestinations.filter(v => majorVenueIds.includes(v.id));
const otherVenues = venueDestinations.filter(v => !majorVenueIds.includes(v.id));

function walkingDirection(venueCoord: Coordinate, destCoord: Coordinate): { minutes: number; miles: number } {
  const miles = milesBetween(venueCoord, destCoord) * 1.25;
  return { minutes: Math.max(1, Math.round(miles * 20)), miles };
}

function nearestQlineStop(venueCoord: Coordinate): { name: string; coordinate: Coordinate; miles: number; minutes: number } | null {
  if (qlineStops.length === 0) return null;
  let closest = qlineStops[0]!;
  let minDist = milesBetween(venueCoord, closest.coordinate);
  for (const stop of qlineStops) {
    const d = milesBetween(venueCoord, stop.coordinate);
    if (d < minDist) {
      minDist = d;
      closest = stop;
    }
  }
  const walkMiles = minDist * 1.25;
  return { name: closest.name, coordinate: closest.coordinate, miles: minDist, minutes: Math.max(1, Math.round(walkMiles * 20)) };
}

function VenueDetail({
  venue,
  parkingId,
  onParkingSelect,
  onStationFocus,
}: {
  venue: VenueDestination;
  parkingId: string | null;
  onParkingSelect: (id: string) => void;
  onStationFocus: (id: string) => void;
}) {
  const nearestStation = peopleMoverStations.find(s => s.id === venue.nearestStationId) ?? null;
  const nearbyParkingList = parkingStructures.filter(p => p.stationId === venue.nearestStationId);
  const stationWalk = nearestStation ? walkingDirection(venue.coordinate, nearestStation.entrance) : null;
  const qline = nearestQlineStop(venue.coordinate);
  const venueMapsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.coordinate[1]},${venue.coordinate[0]}`;

  return (
    <div className="imgoing-venue-detail">
      <div className="imgoing-venue-hero">
        <div className="imgoing-venue-hero-left">
          <span className="imgoing-venue-cat-chip">{venue.category.toUpperCase()}</span>
          <p className="imgoing-venue-desc">{venue.description}</p>
        </div>
        <Button variant="hudActive" asChild size="sm" className="imgoing-venue-maps-btn">
          <a href={venueMapsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation2 size={14} /> DIRECTIONS <ExternalLink size={11} />
          </a>
        </Button>
      </div>

      <div className="imgoing-section-title">
        <span><Train size={12} /> NEAREST TRANSIT STATION</span>
        <span>PEOPLE MOVER</span>
      </div>
      {nearestStation ? (
        <div className="imgoing-transit-card">
          <button
            type="button"
            className={`imgoing-transit-btn ${parkingId === null ? 'imgoing-transit-active' : ''}`}
            onClick={() => onStationFocus(nearestStation.id)}
          >
            <span className="imgoing-transit-icon"><TrainFront size={16} /></span>
            <span className="imgoing-transit-info">
              <strong>{nearestStation.name}</strong>
              <small>{stationWalk ? `${stationWalk.miles.toFixed(2)} mi · ~${stationWalk.minutes} min walk from venue` : nearestStation.neighborhood}</small>
            </span>
            <span className="imgoing-transit-walk">
              <Footprints size={13} />
              <span>{stationWalk?.minutes ?? '?'}m</span>
            </span>
          </button>
          {qline && (
            <div className="imgoing-qline-row">
              <span className="imgoing-qline-label"><Train size={11} /> QLINE</span>
              <span className="imgoing-qline-stop">{qline.name}</span>
              <span className="imgoing-qline-walk">~{qline.minutes} min walk</span>
            </div>
          )}
        </div>
      ) : (
        <p className="imgoing-empty">No nearby transit station data.</p>
      )}

      <div className="imgoing-section-title">
        <span><Car size={12} /> NEARBY PARKING STRUCTURES</span>
        <span>{nearbyParkingList.length} FOUND</span>
      </div>
      {nearbyParkingList.length ? (
        <div className="imgoing-parking-list">
          {nearbyParkingList.map(p => {
            const parkingWalk = walkingDirection(venue.coordinate, p.coordinate);
            return (
              <button
                key={p.id}
                type="button"
                className={`imgoing-parking-item ${parkingId === p.id ? 'imgoing-parking-active' : ''}`}
                onClick={() => onParkingSelect(p.id)}
              >
                <span className="imgoing-parking-icon"><Car size={15} /></span>
                <span className="imgoing-parking-main">
                  <strong>{p.name}</strong>
                  <small>{p.address}</small>
                  <small className="imgoing-parking-cap">{p.capacityNote}</small>
                </span>
                <span className="imgoing-parking-walk">
                  <Footprints size={12} />
                  <span>~{parkingWalk.minutes}m</span>
                  <span className="imgoing-parking-miles">{parkingWalk.miles.toFixed(2)} mi</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="imgoing-empty">No parking structures mapped to this venue's nearest station.</p>
      )}

      <div className="imgoing-section-title">
        <span><Footprints size={12} /> WALKING ROUTE</span>
        <span>FROM STATION TO VENUE</span>
      </div>
      {nearestStation && stationWalk ? (
        <div className="imgoing-walking-card">
          <div className="imgoing-walking-route">
            <span className="imgoing-walking-node imgoing-walking-origin">
              <TrainFront size={14} />
              <strong>{nearestStation.name}</strong>
            </span>
            <span className="imgoing-walking-line" />
            <span className="imgoing-walking-node imgoing-walking-dest">
              <MapPin size={14} />
              <strong>{venue.name}</strong>
            </span>
          </div>
          <div className="imgoing-walking-stats">
            <div><span>EST. WALK</span><strong>{stationWalk.minutes} min</strong></div>
            <div><span>DISTANCE</span><strong>{stationWalk.miles.toFixed(2)} mi</strong></div>
            <div><span>STATION</span><strong>{nearestStation.crossStreets}</strong></div>
          </div>
          <Button variant="hudOutline" asChild size="sm" className="imgoing-walking-btn">
            <a href={`https://www.google.com/maps/dir/?api=1&origin=${nearestStation.entrance[1]},${nearestStation.entrance[0]}&destination=${venue.coordinate[1]},${venue.coordinate[0]}&travelmode=walking`} target="_blank" rel="noopener noreferrer">
              <Footprints size={14} /> WALKING DIRECTIONS <ExternalLink size={11} />
            </a>
          </Button>
        </div>
      ) : (
        <p className="imgoing-empty">Walking route data unavailable for this venue.</p>
      )}

      <p className="imgoing-disclaimer">
        <MapPin size={11} /> Distances are straight-line estimates, not routed paths. Transit times are scheduled, not live. Vehicle positions are simulated.
      </p>
    </div>
  );
}

export default function ImGoingToModal({ open, onOpenChange, venueId, onVenueSelect, parkingId, onParkingSelect, onStationFocus }: Props) {
  const selectedVenue = venueDestinations.find(v => v.id === venueId) ?? null;

  const majorVenueItems = useMemo(() => majorVenues, []);
  const otherVenueItems = useMemo(() => otherVenues, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="imgoing-dialog">
        <DialogHeader>
          <DialogTitle>I'm Going To</DialogTitle>
          <DialogDescription>Pick a Detroit destination to inspect nearby parking, transit, and walking routes.</DialogDescription>
        </DialogHeader>

        {!selectedVenue ? (
          <div className="imgoing-venue-picker">
            <div className="imgoing-picker-section">
              <span className="imgoing-picker-heading"><Building2 size={12} /> MAJOR VENUES</span>
              <div className="imgoing-venue-grid">
                {majorVenueItems.map(venue => (
                  <button
                    key={venue.id}
                    type="button"
                    className="imgoing-venue-card"
                    onClick={() => onVenueSelect(venue.id)}
                  >
                    <span className="imgoing-venue-card-icon"><MapPin size={18} /></span>
                    <span className="imgoing-venue-card-name">{venue.name}</span>
                    <span className="imgoing-venue-card-cat">{venue.category}</span>
                  </button>
                ))}
              </div>
            </div>
            {otherVenueItems.length > 0 && (
              <div className="imgoing-picker-section">
                <span className="imgoing-picker-heading"><MapPin size={12} /> MORE DETROIT DESTINATIONS</span>
                <div className="imgoing-venue-list">
                  {otherVenueItems.map(venue => (
                    <button
                      key={venue.id}
                      type="button"
                      className="imgoing-venue-row"
                      onClick={() => onVenueSelect(venue.id)}
                    >
                      <span className="imgoing-venue-row-icon"><MapPin size={14} /></span>
                      <span className="imgoing-venue-row-info">
                        <strong>{venue.name}</strong>
                        <small>{venue.address}</small>
                      </span>
                      <span className="imgoing-venue-row-cat">{venue.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="imgoing-venue-panel">
            <button type="button" className="imgoing-back-btn" onClick={() => onVenueSelect('')}>
              <span>&larr;</span> ALL DESTINATIONS
            </button>
            <div className="imgoing-venue-header">
              <div className="imgoing-venue-eyebrow"><span className="signal-dot" /> DESTINATION / {selectedVenue.category.toUpperCase()}</div>
              <h3>{selectedVenue.name}</h3>
              <p className="imgoing-venue-address"><MapPin size={12} /> {selectedVenue.address}</p>
            </div>
            <VenueDetail
              venue={selectedVenue}
              parkingId={parkingId}
              onParkingSelect={onParkingSelect}
              onStationFocus={onStationFocus}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
