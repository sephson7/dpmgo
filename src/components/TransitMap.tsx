import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type * as GeoJSON from 'geojson';
import { peopleMoverServiceRunning } from '@/data/schedule';
import { simulatedMoverTrains } from '@/data/trainSimulation';
import { peopleMoverShape, peopleMoverStations, qlineStops, restaurants, type Coordinate } from '@/data/transit';

type Props = { peopleMover: boolean; qline: boolean; selectedId: string | null; onSelect: (id: string) => void; onReady?: (ready: boolean) => void; restaurantId?: string | null };
type Point = GeoJSON.Feature<GeoJSON.Point>;
const point = (coordinate: Coordinate): Point => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: coordinate } });
const route = (coordinates: Coordinate[]): GeoJSON.Feature<GeoJSON.LineString> => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
const qPath = qlineStops.map(s => s.coordinate);
const routeData = (coordinates: Coordinate[]): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: [route(coordinates)] });
const dotData = (coordinate: Coordinate): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: [point(coordinate)] });
const downtownCenter: Coordinate = [-83.0458, 42.3314];
const qlineVehicleData = (elapsed: number): GeoJSON.FeatureCollection => {
  const segments = (qPath.length - 1) * 2;
  const step = Math.floor(elapsed / 23000) % segments;
  const from = step < qPath.length - 1 ? step : segments - step;
  const to = step < qPath.length - 1 ? from + 1 : from - 1;
  const a = qPath[from] ?? downtownCenter;
  const b = qPath[to] ?? a;
  const bearing = Math.atan2((b[0] - a[0]) * Math.cos(a[1] * Math.PI / 180), b[1] - a[1]) * 180 / Math.PI;
  return { type: 'FeatureCollection', features: [{ ...point(simulatedPosition(qPath, elapsed, false)), properties: { rotation: bearing - 90 } }] };
};

// This is a visual simulation, not a feed of real vehicle positions. Each stop holds for 12 seconds.
function simulatedPosition(path: Coordinate[], elapsed: number, loop: boolean): Coordinate {
  if (path.length < 2) return path[0] ?? [-83.0458, 42.3314];
  const dwell = 12000;
  const travel = 11000;
  const segments = loop ? path.length : (path.length - 1) * 2;
  const step = Math.floor(elapsed / (dwell + travel)) % segments;
  const progress = Math.max(0, Math.min(1, (elapsed % (dwell + travel) - dwell) / travel));
  const from = loop ? step : step < path.length - 1 ? step : segments - step;
  const to = loop ? (from + 1) % path.length : step < path.length - 1 ? from + 1 : from - 1;
  const a = path[from] ?? path[0] ?? [-83.0458, 42.3314]; const b = path[to] ?? path[0] ?? [-83.0458, 42.3314];
  return [a[0] + (b[0] - a[0]) * progress, a[1] + (b[1] - a[1]) * progress];
}

export default function TransitMap({ peopleMover, qline, selectedId, onSelect, onReady, restaurantId }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const enabledRef = useRef({ peopleMover, qline });
  onSelectRef.current = onSelect;
  enabledRef.current = { peopleMover, qline };

  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = import.meta.env['VITE_MAPBOX_TOKEN'] || import.meta.env['VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN'] || 'pk.eyJ1Ijoic2VwaDA3IiwiYSI6ImNtdXJlemRzdDBsbGIyem9lM3FiMjNybTgifQ.L5t2LjoKXMStl9gL-837Nw';
    const map = new mapboxgl.Map({ container: container.current, style: 'mapbox://styles/mapbox/satellite-streets-v12', center: [-83.0458, 42.3314], zoom: 15.5, pitch: 50, bearing: -20, antialias: true, attributionControl: false });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true, showAccuracyCircle: true }), 'top-right');
    let frame = 0;
    const addLine = (id: string, coordinates: Coordinate[], color: string, width: number) => {
      map.addSource(id, { type: 'geojson', data: routeData(coordinates) });
      map.addLayer({ id, type: 'line', source: id, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': color, 'line-width': width, 'line-opacity': 0.95, 'line-blur': 0.35 } });
    };
    map.on('load', () => {
      // Extrude building footprints where the Mapbox composite source provides them.
      try {
        map.addLayer({ id: 'dpm-3d-buildings', source: 'composite', 'source-layer': 'building', filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14, paint: { 'fill-extrusion-color': '#7e9aa7', 'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']], 'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']], 'fill-extrusion-opacity': 0.66 } });
      } catch { /* Some satellite styles do not expose the building source. */ }
       addLine('mover-line', peopleMoverShape, '#00f0ff', 4);
      addLine('qline-line', qPath, '#ffbb70', 3);
      map.addSource('stations', { type: 'geojson', data: { type: 'FeatureCollection', features: peopleMoverStations.map((s, i) => ({ ...point(s.coordinate), properties: { id: s.id, name: s.name, number: i + 1 } })) } });
      map.addLayer({ id: 'station-halo', type: 'circle', source: 'stations', paint: { 'circle-radius': 15, 'circle-color': '#00f0ff', 'circle-opacity': 0.15, 'circle-blur': 0.55 } });
      map.addLayer({ id: 'station-pins', type: 'circle', source: 'stations', paint: { 'circle-radius': 7, 'circle-color': '#07131b', 'circle-stroke-color': '#00f0ff', 'circle-stroke-width': 2.5 } });
      map.addLayer({ id: 'station-labels', type: 'symbol', source: 'stations', layout: { 'text-field': ['get', 'name'], 'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'], 'text-size': 11, 'text-offset': [0, 1.45], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': '#eafaff', 'text-halo-color': '#07131b', 'text-halo-width': 1.5 } });
      map.addSource('qline-stops', { type: 'geojson', data: { type: 'FeatureCollection', features: qlineStops.map(s => point(s.coordinate)) } });
      map.addLayer({ id: 'qline-stops', type: 'circle', source: 'qline-stops', paint: { 'circle-radius': 4, 'circle-color': '#ffbb70', 'circle-stroke-color': '#07131b', 'circle-stroke-width': 1.5 } });
      const moverData = (elapsed: number): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: simulatedMoverTrains(elapsed).map(train => ({ ...point(train.coordinate), properties: { rotation: train.bearing - 90 } })) });
      map.addSource('mover-vehicle', { type: 'geojson', data: moverData(0) });
      const pixels = new Uint8Array(20 * 10 * 4);
      for (let y = 1; y < 9; y += 1) for (let x = 1; x < 19; x += 1) {
        const i = (y * 20 + x) * 4;
        pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 255;
      }
      map.addImage('train-rectangle', { width: 20, height: 10, data: pixels }, { sdf: true });
      const tokenColor = (token: string) => {
        const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
        const context = canvas.getContext('2d');
        if (!context) return 'transparent';
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        return `rgb(${r}, ${g}, ${b})`;
      };
      map.addSource('qline-vehicle', { type: 'geojson', data: qlineVehicleData(0) });
      for (const [id, color] of [['mover-vehicle', tokenColor('--primary')], ['qline-vehicle', tokenColor('--warm')]] as const) {
        map.addLayer({ id: `${id}-glow`, type: 'circle', source: id, paint: { 'circle-radius': 19, 'circle-color': color, 'circle-opacity': 0.24, 'circle-blur': 0.65 } });
        map.addLayer({ id, type: 'symbol', source: id, layout: { 'icon-image': 'train-rectangle', 'icon-size': 1.25, 'icon-rotate': ['coalesce', ['get', 'rotation'], 0], 'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map', 'icon-allow-overlap': true, 'icon-ignore-placement': true }, paint: { 'icon-color': color, 'icon-halo-color': tokenColor('--background'), 'icon-halo-width': 1 } });
      }
      map.addSource('restaurant-pin', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'restaurant-pin-glow', type: 'circle', source: 'restaurant-pin', paint: { 'circle-radius': 22, 'circle-color': '#ff4fd8', 'circle-opacity': 0.25, 'circle-blur': 0.6 } });
      map.addLayer({ id: 'restaurant-pin', type: 'circle', source: 'restaurant-pin', paint: { 'circle-radius': 9, 'circle-color': '#ff4fd8', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2.5 } });
      map.addLayer({ id: 'restaurant-label', type: 'symbol', source: 'restaurant-pin', layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-offset': [0, -1.6], 'text-anchor': 'bottom' }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#07131b', 'text-halo-width': 2 } });
       map.on('click', 'station-pins', e => {
        const id = e.features?.[0]?.properties?.['id'];
        if (typeof id === 'string') onSelectRef.current(id);
      });
       map.on('click', 'station-labels', e => {
         const id = e.features?.[0]?.properties?.['id'];
         if (typeof id === 'string') onSelectRef.current(id);
       });
       for (const layer of ['station-pins', 'station-labels']) {
         map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
         map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
       }
      onReady?.(true);
      let lastUpdate = 0;
      let lastTime: number | null = null;
      let moverElapsed = 0;
      let qlineElapsed = 0;
      let running = peopleMoverServiceRunning();
      let lastServiceCheck = 0;
      const animate = (time: number) => {
        const delta = lastTime === null ? 0 : Math.min(time - lastTime, 1000);
        lastTime = time;
        if (time - lastServiceCheck >= 1000) {
          running = peopleMoverServiceRunning();
          lastServiceCheck = time;
        }
        if (running) moverElapsed += delta;
        qlineElapsed += delta;
        if (time - lastUpdate > 50) {
          if (running) (map.getSource('mover-vehicle') as mapboxgl.GeoJSONSource)?.setData(moverData(moverElapsed));
          (map.getSource('qline-vehicle') as mapboxgl.GeoJSONSource)?.setData(qlineVehicleData(qlineElapsed));
          lastUpdate = time;
        }
        frame = requestAnimationFrame(animate);
      };
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) frame = requestAnimationFrame(animate);
      for (const id of ['mover-line', 'station-halo', 'station-pins', 'station-labels', 'mover-vehicle', 'mover-vehicle-glow']) map.setLayoutProperty(id, 'visibility', enabledRef.current.peopleMover ? 'visible' : 'none');
      for (const id of ['qline-line', 'qline-stops', 'qline-vehicle', 'qline-vehicle-glow']) map.setLayoutProperty(id, 'visibility', enabledRef.current.qline ? 'visible' : 'none');
    });
    const resetView = () => map.flyTo({ center: [-83.0458, 42.3314], zoom: 15.5, pitch: 50, bearing: -20, duration: 900 });
    window.addEventListener('dpm-map-reset', resetView);
    map.on('error', e => { console.warn('Mapbox map error:', e.error); });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('dpm-map-reset', resetView); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('mover-line')) return;
    for (const id of ['mover-line', 'station-halo', 'station-pins', 'station-labels', 'mover-vehicle', 'mover-vehicle-glow']) map.setLayoutProperty(id, 'visibility', peopleMover ? 'visible' : 'none');
    for (const id of ['qline-line', 'qline-stops', 'qline-vehicle', 'qline-vehicle-glow']) map.setLayoutProperty(id, 'visibility', qline ? 'visible' : 'none');
  }, [peopleMover, qline]);

  useEffect(() => {
    const map = mapRef.current;
    const station = peopleMoverStations.find(s => s.id === selectedId);
     if (map && station) map.flyTo({ center: station.coordinate, zoom: Math.max(map.getZoom(), 15.5), duration: 900, essential: true, padding: { top: 0, bottom: Math.min(window.innerHeight * 0.42, 330), left: 0, right: 0 } });
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('restaurant-pin') as mapboxgl.GeoJSONSource | undefined;
    const place = restaurants.find(r => r.id === restaurantId);
    source?.setData({ type: 'FeatureCollection', features: place ? [{ ...point(place.coordinate), properties: { name: place.name } }] : [] });
    if (map && place) map.flyTo({ center: place.coordinate, zoom: 17, duration: 1000, essential: true, padding: { top: 0, bottom: window.innerHeight * 0.45, left: 0, right: 0 } });
  }, [restaurantId]);

  return <div ref={container} className="h-full w-full" aria-label="Satellite map of downtown Detroit transit stops" />;
}
