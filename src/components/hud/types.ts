import type { DestinationShortcut, HowDoIFlow, Station } from '@/data/transit';
import type { StationSchedule } from '@/data/schedule';

/** Which transit layers the map is drawing. */
export type MapLayers = {
  peopleMover: boolean;
  qline: boolean;
  parking: boolean;
};

/**
 * Everything the home strip needs: the station it is about and its published
 * timetable.
 */
export type TickerState = {
  station: Station;
  schedule: StationSchedule;
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
