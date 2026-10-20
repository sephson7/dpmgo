import { Compass, ChevronDown, Building, Flag, Sparkles, Waves, Trees, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { destinationShortcuts, howDoIFlows, type HowDoIFlow } from '@/data/transit';
import type { QuickRouteActions, QuickRouteState } from './types';

// Icon language shared by the desktop preset pills and the Quick Routes menu.
const HOW_DO_I_ICONS: Record<HowDoIFlow['id'], typeof Building> = {
  hotel: Building,
  canada: Flag,
  'campus-martius': Sparkles,
  riverfront: Waves,
};

const DESTINATION_ICONS: Record<string, typeof Trophy> = {
  trees: Trees,
  sparkles: Sparkles,
  waves: Waves,
};

export type QuickRoutesMenuProps = QuickRouteState & QuickRouteActions;

/**
 * The combined preset menu. On a phone the "How Do I?" and "I'm Going To"
 * rows do not fit above the map, so they share one dropdown in the header.
 */
export default function QuickRoutesMenu({
  activeShortcut,
  activeHowDoI,
  onOpenDestination,
  onOpenHowDoI,
}: QuickRoutesMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="hudOutline"
          size="hud"
          className="quick-routes-trigger"
          aria-label="Open the Quick Routes menu"
        >
          <Compass size={14} />
          <span>QUICK ROUTES!</span>
          <ChevronDown size={14} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="quick-routes-menu">
        <DropdownMenuLabel className="quick-routes-menu-label">HOW DO I?</DropdownMenuLabel>
        {howDoIFlows.map(flow => {
          const Icon = HOW_DO_I_ICONS[flow.id];
          return (
            <DropdownMenuItem
              key={flow.id}
              onSelect={() => onOpenHowDoI(flow)}
              className={activeHowDoI?.id === flow.id ? 'quick-routes-item is-active' : 'quick-routes-item'}
            >
              <Icon size={14} />
              <span>{flow.title}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="quick-routes-menu-label">I’M GOING TO:</DropdownMenuLabel>
        {destinationShortcuts.map(dest => {
          const Icon = DESTINATION_ICONS[dest.icon] ?? Trophy;
          return (
            <DropdownMenuItem
              key={dest.id}
              onSelect={() => onOpenDestination(dest)}
              className={activeShortcut?.id === dest.id ? 'quick-routes-item is-active' : 'quick-routes-item'}
            >
              <Icon size={14} />
              <span>{dest.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
