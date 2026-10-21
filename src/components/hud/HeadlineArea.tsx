import type { ReactNode } from 'react';
import { LocateFixed, Navigation2, SquareParking } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapLayers } from './types';

export type HeadlineAreaProps = {
  /** The home strip, shown in place of the cadence readout. */
  strip: ReactNode;
  layers: MapLayers;
  isBoarded: boolean;
  onToggleBoarded: () => void;
  followUser: boolean;
  onToggleFollow: () => void;
  /** True once the device location is known. */
  hasUserPosition: boolean;
  /** Set when the device location could not be read. */
  gpsError: string | null;
  /** Toggles a map layer, keeping at least one network visible. */
  onToggleLayer: (layer: keyof MapLayers) => void;
};

/**
 * The hero block. On a phone only the home strip, the ride toggles and the
 * line switches survive, floating over the map.
 */
export default function HeadlineArea({
  strip,
  layers,
  isBoarded,
  onToggleBoarded,
  followUser,
  onToggleFollow,
  hasUserPosition,
  gpsError,
  onToggleLayer,
}: HeadlineAreaProps) {
  return (
    <section className="headline-area" aria-label="Transit overview">
      <div className="overline">
        <span className="overline-bar" /> DOWNTOWN DETROIT <span className="overline-slash">/</span>{' '}
        SYSTEM OVERVIEW
      </div>
      <h1>
        Move through
        <br />
        <em>the Motor City.</em>
      </h1>
      <p>Two lines. One city. Find your next stop.</p>

      {strip}

      <div className="boarded-action-wrap">
        <Button
          type="button"
          variant={isBoarded ? 'default' : 'outline'}
          size="sm"
          className={`boarded-mode-btn ${isBoarded ? 'is-boarded' : ''}`}
          onClick={onToggleBoarded}
        >
          <Navigation2 size={13} className={isBoarded ? 'animate-pulse text-emerald-400' : ''} />
          <span>{isBoarded ? 'ON BOARD · FOLLOWING RIDE' : 'BOARDED THE TRAIN?'}</span>
        </Button>
        <Button
          type="button"
          variant={followUser ? 'default' : 'outline'}
          size="sm"
          className={`boarded-mode-btn ${followUser ? 'is-boarded' : ''}`}
          disabled={!hasUserPosition}
          onClick={onToggleFollow}
          title={gpsError ?? 'Lock the map onto your device location'}
        >
          <LocateFixed size={13} className={followUser ? 'animate-pulse text-cyan-300' : ''} />
          <span>
            {gpsError ? 'GPS UNAVAILABLE' : followUser ? 'FOLLOWING YOU' : 'LOCK MAP TO ME'}
          </span>
        </Button>
      </div>

      {/* Toggle buttons between People Mover and QLINE */}
      <div className="route-switches" role="group" aria-label="Map layers">
        <Button
          variant={layers.peopleMover ? 'hudActive' : 'hudInactive'}
          size="route"
          aria-pressed={layers.peopleMover}
          onClick={() => onToggleLayer('peopleMover')}
        >
          <span className="route-pill-dot" /> PEOPLE MOVER{' '}
          <span className="route-pill-state">{layers.peopleMover ? 'ON' : 'OFF'}</span>
        </Button>
        <Button
          variant={layers.qline ? 'hudWarm' : 'hudInactive'}
          size="route"
          aria-pressed={layers.qline}
          onClick={() => onToggleLayer('qline')}
        >
          <span className="route-pill-dot" /> QLINE{' '}
          <span className="route-pill-state">{layers.qline ? 'ON' : 'OFF'}</span>
        </Button>
        <Button
          variant={layers.parking ? 'hudWarm' : 'hudInactive'}
          size="route"
          aria-pressed={layers.parking}
          onClick={() => onToggleLayer('parking')}
        >
          <SquareParking size={12} /> PARKING{' '}
          <span className="route-pill-state">{layers.parking ? 'ON' : 'OFF'}</span>
        </Button>
      </div>
    </section>
  );
}
