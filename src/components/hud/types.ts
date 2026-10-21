import type { DestinationShortcut, HowDoIFlow, Station } from '@/data/transit';
import type { StationSchedule } from '@/data/schedule';
import type { QlineStatus } from '@/data/qlineSchedule';

/** Which transit layers the map is drawing. */
export type MapLayers = {
  peopleMover: boolean;
  qline: boolean;
  parking: boolean;
};

/**
 * Everything the home strip needs: the station it is about, its published
 * timetable and the state of the two lines.
 */
export type TickerState = {
  station: Station;
  isQLine: boolean;
  schedule: StationSchedule;
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
