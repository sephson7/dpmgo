import { Radio } from 'lucide-react';
import ArrivalEstimateNote from '@/components/dialogs/ArrivalEstimateNote';

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
      <ArrivalEstimateNote />
    </div>
  );
}
