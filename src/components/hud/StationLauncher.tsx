import { ChevronDown, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type StationLauncherProps = {
  /** Opens the station directory drawer. */
  onOpen: () => void;
};

/**
 * The phone layout opens the station directory from the bottom dock, so the
 * station list is never rendered behind the map.
 */
export default function StationLauncher({ onOpen }: StationLauncherProps) {
  return (
    <Button
      id="station-directory-launcher"
      variant="mobileStations"
      size="hud"
      className="mobile-station-trigger"
      onClick={onOpen}
    >
      <Layers3 size={15} />
      <span>STATIONS</span>
      <ChevronDown size={15} />
    </Button>
  );
}
