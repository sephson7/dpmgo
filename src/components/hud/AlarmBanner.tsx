import { Bell, BellOff } from 'lucide-react';
import type { Station } from '@/data/transit';

export type AlarmBannerProps = {
  /** The station the rider is watching, if any. */
  target: Station | null;
  /** True when the train has arrived. */
  triggered: boolean;
  /** Distance to the platform, in miles. */
  distanceMiles?: number | null;
  onCancel: () => void;
};

/** The stop alarm banner that sits over the map. */
export default function AlarmBanner({
  target,
  triggered,
  distanceMiles,
  onCancel,
}: AlarmBannerProps) {
  if (!target) return null;

  return (
    <div className={`active-alarm-banner ${triggered ? 'alarm-triggered' : ''}`}>
      <Bell size={14} className="animate-bounce" />
      <span>
        {triggered
          ? `ARRIVING AT ${target.name.toUpperCase()}!`
          : `STOP ALARM: ${target.name} (~${distanceMiles?.toFixed(2) ?? '...'} mi)`}
      </span>
      <button type="button" onClick={onCancel} className="alarm-cancel-btn" title="Cancel alert" aria-label="Cancel alert">
        <BellOff size={13} />
      </button>
    </div>
  );
}
