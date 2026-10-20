import { useEffect, useState, type ComponentType } from 'react';
import type { TransitMapProps } from '@/components/TransitMap';

export type MapStageProps = TransitMapProps;

/**
 * The 3D canvas. Mapbox is loaded on the client only, because the map library
 * needs browser APIs while the module is evaluated.
 */
export default function MapStage({ onReady, ...mapProps }: MapStageProps) {
  const [MapComponent, setMapComponent] = useState<ComponentType<TransitMapProps> | null>(null);

  useEffect(() => {
    import('@/components/TransitMap').then(module => setMapComponent(() => module.default));
  }, []);

  return (
    <div className="map-plane" aria-hidden={!MapComponent}>
      <div className="map-placeholder" aria-hidden="true">
        <div className="map-placeholder-grid" />
      </div>
      {MapComponent && <MapComponent {...mapProps} onReady={onReady} />}
      <div className="map-vignette" />
    </div>
  );
}
