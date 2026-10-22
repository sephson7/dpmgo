import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArrivalEstimateNote from '@/components/dialogs/ArrivalEstimateNote';

export type MapChromeProps = {
  /** True when the parking layer is on, so the legend can list it. */
  parking: boolean;
  /** Clears the marked locations and returns to the downtown overview. */
  onReset: () => void;
};

/**
 * The floating chrome over the map: the reset control, the legend and the
 * downtown coordinate readout.
 */
export default function MapChrome({ parking, onReset }: MapChromeProps) {
  return (
    <>
      <div className="map-overlay-info">
        <span className="map-crosshair">⊕</span>
        <div>
          <strong>DOWNTOWN DETROIT</strong>
          <small>42.3314° N &nbsp; 83.0458° W</small>
        </div>
      </div>
      <div className="map-controls">
        <Button
          variant="mapControl"
          size="icon"
          className="map-reset-btn"
          title="Reset map view and clear marked locations"
          aria-label="Reset map view and clear marked locations"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          <span className="map-reset-btn-label">RESET MAP VIEW</span>
        </Button>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-line cyan-line" /> PEOPLE MOVER
        </span>
        <span>
          <i className="legend-line warm-line" /> QLINE
        </span>
        <span>
          <i className="legend-vehicle" /> <ArrivalEstimateNote />
        </span>
        {parking && (
          <span>
            <i className="legend-line warm-line" /> PARKING GARAGE
          </span>
        )}
      </div>
    </>
  );
}
