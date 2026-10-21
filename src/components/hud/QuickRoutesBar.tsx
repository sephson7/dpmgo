import { Compass, Navigation2, Building, Flag, Sparkles, Waves, Trophy } from 'lucide-react';
import { destinationShortcuts, howDoIFlows, type HowDoIFlow } from '@/data/transit';
import type { QuickRouteActions, QuickRouteState } from './types';

// The desktop pills keep their short labels; the full titles are used by the
// Quick Routes menu, where there is room for them.
const HOW_DO_I_ICONS: Record<HowDoIFlow['id'], typeof Building> = {
  hotel: Building,
  canada: Flag,
  'campus-martius': Sparkles,
  riverfront: Waves,
};

const HOW_DO_I_LABELS: Record<HowDoIFlow['id'], string> = {
  hotel: 'Hotel',
  canada: 'Canada',
  'campus-martius': 'Campus Martius',
  riverfront: 'Riverfront',
};

export type QuickRoutesBarProps = QuickRouteState & QuickRouteActions;

/**
 * The preset route pills. The desktop layout has room for both rows, so they
 * stay on one line under the header.
 */
export default function QuickRoutesBar({
  activeShortcut,
  activeHowDoI,
  onOpenDestination,
  onOpenHowDoI,
}: QuickRoutesBarProps) {
  return (
    <div className="dpm-quick-nav-bar">
      <div className="dpm-quick-nav-group">
        <span className="dpm-quick-nav-title">
          <Compass size={11} /> HOW DO I?
        </span>
        <div className="dpm-quick-nav-scroll">
          {howDoIFlows.map((flow) => {
            const Icon = HOW_DO_I_ICONS[flow.id];
            return (
              <button
                key={flow.id}
                type="button"
                className={`dpm-nav-pill ${activeHowDoI?.id === flow.id ? 'active' : ''}`}
                onClick={() => onOpenHowDoI(flow)}
              >
                <Icon size={12} />
                <span>{HOW_DO_I_LABELS[flow.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dpm-quick-nav-group destination-group">
        <span className="dpm-quick-nav-title">
          <Navigation2 size={11} /> I’M GOING TO:
        </span>
        <div className="dpm-quick-nav-scroll">
          {destinationShortcuts.map((dest) => (
            <button
              key={dest.id}
              type="button"
              className={`dpm-nav-pill dest-pill ${activeShortcut?.id === dest.id ? 'active' : ''}`}
              onClick={() => onOpenDestination(dest)}
            >
              <Trophy size={12} />
              <span>{dest.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
