import { Radio } from 'lucide-react';

export type StatusStripProps = {
  /** True once the map canvas is live. */
  mapReady: boolean;
};

/** The bottom status bar of the transit HUD. */
export default function StatusStrip({ mapReady }: StatusStripProps) {
  return (
    <div className="status-strip">
      <div>
        <Radio size={14} />
        <strong>NETWORK VISUALIZATION</strong>
        <span className="status-divider">/</span>
        <span>{mapReady ? 'MAP ONLINE' : 'LOADING MAP'}</span>
      </div>
      <span className="truncate max-w-md">
        Arrivals calculated from published headway schedules. Real-time agency telemetry currently
        unavailable from DTC.
      </span>
    </div>
  );
}
