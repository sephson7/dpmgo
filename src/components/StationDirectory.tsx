import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Station } from '@/data/transit';

type Props = {
  stations: Station[];
  /** Full station list, used for the stable station numbers. */
  numbering: Station[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  /** The sheet variant shows the line next to the station name. */
  showLine?: boolean;
};

/**
 * Keyboard accessible station directory. The map pins are drawn on a canvas
 * and cannot be focused, so this list is the keyboard route to every stop:
 * Tab reaches the list, then the arrow keys move between stations, Home and
 * End jump to the ends, and Enter or Space opens a station.
 */
export default function StationDirectory({
  stations,
  numbering,
  selectedId,
  onSelect,
  label,
  showLine = false,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(stations[0]?.id ?? null);

  // Keep the active row valid when the filtered list changes.
  useEffect(() => {
    if (stations.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !stations.some(station => station.id === activeId)) {
      setActiveId(stations[0]!.id);
    }
  }, [stations, activeId]);

  const focusStation = (id: string | undefined) => {
    if (!id) return;
    setActiveId(id);
    const element = listRef.current?.querySelector<HTMLElement>(`[data-station-id="${id}"]`);
    element?.focus();
    if (typeof element?.scrollIntoView === 'function') {
      element.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (stations.length === 0) return;
    const index = stations.findIndex(station => station.id === activeId);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusStation(stations[Math.min(index + 1, stations.length - 1)]?.id);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusStation(stations[Math.max(index - 1, 0)]?.id);
        break;
      case 'Home':
        event.preventDefault();
        focusStation(stations[0]?.id);
        break;
      case 'End':
        event.preventDefault();
        focusStation(stations[stations.length - 1]?.id);
        break;
      default:
        break;
    }
  };

  if (stations.length === 0) {
    return <div className="empty-search">No stations match your search.</div>;
  }

  return (
    <div ref={listRef} role="group" aria-label={label} onKeyDown={handleKeyDown}>
      {stations.map(station => {
        const isActive = station.id === activeId;
        const isSelected = station.id === selectedId;
        const number = numbering.findIndex(entry => entry.id === station.id) + 1;
        return (
          <Button
            key={station.id}
            variant="station"
            size="station"
            data-station-id={station.id}
            tabIndex={isActive ? 0 : -1}
            aria-current={isSelected ? 'true' : undefined}
            onClick={() => {
              setActiveId(station.id);
              onSelect(station.id);
            }}
            className={isSelected ? 'station-selected' : ''}
          >
            <span className="station-number">
              {station.line === 'qline' ? 'QL' : 'DPM'}
              {String(number).padStart(2, '0')}
            </span>
            <span className="station-track">
              <span className="station-node" />
            </span>
            <span className="station-name">
              {station.name}
              {showLine && (
                <small className="text-muted-foreground ml-1">
                  ({station.line === 'qline' ? 'QLINE' : 'DPM'})
                </small>
              )}
            </span>
            <ArrowRight size={14} className="station-arrow" />
          </Button>
        );
      })}
    </div>
  );
}
