import type { ReactNode } from 'react';
import { ChevronDown, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sportsTeams } from '@/data/transit';
import logo from '@/assets/dpm-go-logo-clean.png.asset.json';

export type TopBarProps = {
  /** Opens the downtown activities or a sports panel. */
  onSelectPanel: (panel: string) => void;
  /** Opens the station directory drawer. */
  onOpenStationDirectory: () => void;
  /**
   * The Quick Routes trigger. It is only rendered on the phone layout, where
   * the preset pills collapse into one dropdown.
   */
  quickRoutes?: ReactNode;
};

/** The header: the brand, the city tag, the explore menu and the directory. */
export default function TopBar({
  onSelectPanel,
  onOpenStationDirectory,
  quickRoutes,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <img src={logo.url} alt="DPM - Go!" className="brand-logo" />
      </div>
      <div className="topbar-right">
        <div className="city-tag">
          <span className="signal-dot" /> DETROIT, MI <span className="tag-divider">/</span> TRANSIT
          NETWORK
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="hudOutline"
              size="hud"
              aria-label="Open Detroit events and sports links"
            >
              <span className="desktop-label">EXPLORE DETROIT</span>
              <span className="mobile-label">EVENTS</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-menu">
            <DropdownMenuLabel>LOCAL DESTINATIONS</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onSelectPanel('activities')}>
              <span>Downtown Activities</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>DETROIT SPORTS</DropdownMenuLabel>
            {sportsTeams.map((item) => (
              <DropdownMenuItem key={item.id} onClick={() => onSelectPanel(item.id)}>
                <span>{item.team}</span>
                <small className="menu-sub">{item.league}</small>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {quickRoutes}
        <Button
          variant="hudOutline"
          size="hud"
          className="station-list-btn"
          onClick={onOpenStationDirectory}
        >
          <Layers3 size={14} />
          <span>STATIONS</span>
        </Button>
      </div>
    </header>
  );
}
