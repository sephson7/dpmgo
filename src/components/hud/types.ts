import type { DestinationShortcut, HowDoIFlow, Station } from '@/data/transit';
import type { StationSchedule } from '@/data/schedule';
import type { ArrivalReadout } from '@/data/trainSimulation';
import type { QlineStatus } from '@/data/qlineSchedule';

/** Which transit layers the map is drawing. */
export type MapLayers = {
  peopleMover: boolean;
  qline: boolean;
  parking: boolean;
};

/**
 * Everything the cadence readouts need. The People Mover arrival comes from
 * the fleet clock that draws the vehicles, so the two always agree.
 */
export type TickerState = {
  station: Station;
  isQLine: boolean;
  schedule: StationSchedule;
  arrival: ArrivalReadout;
  qline: QlineStatus;
};

/** Which preset route is active, if any. */
export type QuickRouteState = {
  activeShortcut: DestinationShortcut | null;
  activeHowDoI: HowDoIFlow | null;
};

/** The actions the preset routes trigger. */
export type QuickRouteActions = {
  onOpenDestination: (shortcut: DestinationShortcut) => void;
  onOpenHowDoI: (flow: HowDoIFlow) => void;
};
