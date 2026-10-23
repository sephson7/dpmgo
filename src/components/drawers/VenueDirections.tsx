import { useEffect, useState } from 'react';
import { Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { walkingDirectionsUrl, usesAppleMaps } from '@/data/walkingDirections';
import type { Coordinate } from '@/data/transit';

export default function VenueDirections({
  name,
  coordinate,
}: {
  name: string;
  coordinate: Coordinate;
}) {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    setApple(usesAppleMaps(navigator.userAgent, navigator.maxTouchPoints));
  }, []);
  const label = `Walk to ${name} in ${apple ? 'Apple' : 'Google'} Maps`;
  return (
    <Button variant="hudOutline" size="icon" asChild className="venue-directions-link">
      <a
        href={walkingDirectionsUrl(coordinate, apple)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Navigation2 size={16} />
      </a>
    </Button>
  );
}
