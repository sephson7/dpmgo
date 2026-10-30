import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { allTransitStations } from '@/data/transit';
import { mapHudArrival, mapHudStops } from '@/data/mapHud';

type Props = {
  map: mapboxgl.Map;
  peopleMover: boolean;
  qline: boolean;
  onSelect: (id: string) => void;
};

export default function FloatingArrivalPills({ map, peopleMover, qline, onSelect }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [hosts, setHosts] = useState<{ element: HTMLDivElement; stationId: string }[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const entries = mapHudStops.flatMap((stop) => {
      const station = allTransitStations.find((item) => item.id === stop.stationId);
      if (!station || !(station.line === 'mover' ? peopleMover : qline)) return [];
      const element = document.createElement('div');
      element.className = `arrival-marker arrival-marker--${station.line}`;
      const marker = new mapboxgl.Marker({ element, anchor: 'bottom', offset: [0, -24] })
        .setLngLat(station.coordinate)
        .addTo(map);
      return [{ element, stationId: station.id, marker }];
    });
    setHosts(entries);
    // Hide a lower-priority pill when it would overlap another pill or the HUD.
    const position = () => {
      const occupied: DOMRect[] = [];
      const phone = window.innerWidth <= 768;
      const dock = document.querySelector('.bottom-dock')?.getBoundingClientRect();
      for (const entry of entries) {
        const rect = entry.element.getBoundingClientRect();
        const hidden = rect.top < (phone ? 190 : 95) || rect.bottom > (dock?.top ?? window.innerHeight) - 12 ||
          rect.left < 8 || rect.right > window.innerWidth - 8 ||
          occupied.some((other) => rect.left < other.right + 8 && rect.right > other.left - 8 && rect.top < other.bottom + 8 && rect.bottom > other.top - 8);
        entry.element.style.visibility = hidden ? 'hidden' : 'visible';
        if (!hidden) occupied.push(rect);
      }
    };
    map.on('render', position);
    return () => {
      map.off('render', position);
      entries.forEach((entry) => entry.marker.remove());
    };
  }, [map, peopleMover, qline]);

  return hosts.map(({ element, stationId }) => {
    const stop = mapHudStops.find((item) => item.stationId === stationId);
    const station = allTransitStations.find((item) => item.id === stationId);
    if (!stop || !station) return null;
    const minutes = mapHudArrival(stationId, now);
    const value = minutes === null ? 'No service' : minutes === 0 ? 'Due' : `${minutes} min`;
    return createPortal(
      <Button variant="ghost" className="arrival-pill" onClick={() => onSelect(stationId)}
        aria-label={`${stop.label}, ${value}, estimated, ${stop.detail}`}>
        <span className="arrival-pill__row"><strong>{stop.label}</strong><span className="arrival-pill__eta">{value}</span></span>
        <span className="arrival-pill__meta"><span className="arrival-pill__badge">{station.line === 'mover' ? 'DPM' : 'QLINE'}</span>{stop.detail} · Est.</span>
      </Button>, element, stationId,
    );
  });
}