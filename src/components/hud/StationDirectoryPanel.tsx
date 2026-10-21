import { ArrowRight, Route as RouteIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StationDirectory from '@/components/StationDirectory';
import { parkingGarages } from '@/data/parking';
import { type Station } from '@/data/transit';
import TickerHud from './TickerHud';
import type { MapLayers, TickerState } from './types';

export type StationDirectoryPanelProps = {
  /** The stations of the networks that are currently on. */
  stations: Station[];
  /** The stations that match the search box. */
  filtered: Station[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  layers: MapLayers;
  onFlyTo: (name: string, coordinate: [number, number]) => void;
  ticker: TickerState;
};

/**
 * The desktop side panel: the network summary, the cadence readout and the
 * station directory. On a phone the directory is served by the drawer, so
 * this panel is not rendered at all.
 */
export default function StationDirectoryPanel({
  stations,
  filtered,
  selectedId,
  onSelect,
  search,
  onSearch,
  layers,
  onFlyTo,
  ticker,
}: StationDirectoryPanelProps) {
  const onlyQline = !layers.peopleMover && layers.qline;
  const onlyMover = layers.peopleMover && !layers.qline;

  return (
    <aside className="network-panel" aria-label="Transit stations">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">
            <span className="signal-dot" />{' '}
            {onlyQline
              ? 'NETWORK 02 · QLINE'
              : onlyMover
                ? 'NETWORK 01 · DPM'
                : 'TRANSIT DIRECTORY'}
          </div>
          <h2>{onlyQline ? 'QLINE Streetcar' : onlyMover ? 'People Mover' : 'Detroit Transit'}</h2>
          <p>
            {onlyQline
              ? 'Woodward Corridor · 12 stations · 3.3 miles'
              : onlyMover
                ? 'Downtown loop · 13 stations · 2.9 miles'
                : 'People Mover & QLINE · 25 stations'}
          </p>

          <TickerHud ticker={ticker} />
        </div>
        <RouteIcon size={20} className="panel-route-icon" />
      </div>

      <div className="panel-rule" />
      <div className="panel-section-title">
        <span>STATION DIRECTORY</span>
        <span>01 — {String(stations.length).padStart(2, '0')}</span>
      </div>
      <label className="station-search">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Find a station..."
          aria-label="Find a station"
        />
        <kbd>⌕</kbd>
      </label>
      <div className="station-scroll" id="station-directory">
        <StationDirectory
          stations={filtered}
          numbering={stations}
          selectedId={selectedId}
          onSelect={onSelect}
          label="Transit stations"
        />
      </div>
      {layers.parking && (
        <>
          <div className="panel-rule" />
          <div className="panel-section-title">
            <span>PARK ONCE DIRECTORY</span>
            <span>02 — {String(parkingGarages.length).padStart(2, '0')}</span>
          </div>
          <div className="station-scroll">
            {parkingGarages.map((garage) => (
              <Button
                key={garage.id}
                variant="station"
                size="station"
                onClick={() => onFlyTo(garage.name, garage.coordinate)}
              >
                <span className="station-number">{garage.parkOnce ? 'P1' : 'P0'}</span>
                <span className="station-track">
                  <span className="station-node" />
                </span>
                <span className="station-name">{garage.name}</span>
                <ArrowRight size={14} className="station-arrow" />
              </Button>
            ))}
          </div>
          <div className="panel-bottom">
            <span>
              <span className="tiny-diamond" /> RATES CONFIRM ON ARRIVAL
            </span>
            <span>{parkingGarages.filter((g) => g.parkOnce).length} PARK ONCE</span>
          </div>
        </>
      )}
      {!layers.parking && (
        <div className="panel-bottom">
          <span>
            <span className="tiny-diamond" /> INTERACTIVE PLATFORMS
          </span>
          <span>SIMULATED VEHICLES</span>
        </div>
      )}
    </aside>
  );
}
