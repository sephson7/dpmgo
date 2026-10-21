import { Search, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import StationDirectory from '@/components/StationDirectory';
import type { Station } from '@/data/transit';

export type StationDirectoryDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The stations of the networks that are currently on. */
  stations: Station[];
  /** The stations that match the search box. */
  filtered: Station[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
};

/** The station directory drawer, used by the phone layout. */
export default function StationDirectoryDrawer({
  open,
  onOpenChange,
  stations,
  filtered,
  selectedId,
  onSelect,
  search,
  onSearch,
}: StationDirectoryDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="drawer-shell station-drawer">
        <DrawerHeader className="detail-heading">
          <div className="drawer-header-top">
            <div className="drawer-eyebrow">DETROIT TRANSIT</div>
            <DrawerClose asChild>
              <button
                type="button"
                className="drawer-close-btn"
                aria-label="Close station directory"
              >
                <X size={18} />
              </button>
            </DrawerClose>
          </div>
          <DrawerTitle>Station Directory</DrawerTitle>
          <DrawerDescription>
            Select any station across the People Mover and QLINE corridors.
          </DrawerDescription>
        </DrawerHeader>
        <div className="drawer-search-wrap">
          <label className="station-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Find a station..."
              aria-label="Filter station directory"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearch('')}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </label>
        </div>
        <div className="station-drawer-list">
          <StationDirectory
            stations={filtered}
            numbering={stations}
            selectedId={selectedId}
            onSelect={onSelect}
            label="Transit stations"
            showLine
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
