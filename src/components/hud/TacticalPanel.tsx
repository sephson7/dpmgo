import { useState } from 'react';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArrivalEstimateNote from '@/components/dialogs/ArrivalEstimateNote';
import { allTransitStations, destinationShortcuts, type DestinationShortcut } from '@/data/transit';
import { peopleMoverServiceRunning } from '@/data/schedule';
import { qlineServiceRunning } from '@/data/qlineSchedule';

type Props = {
  now: Date;
  onStation: (id: string) => void;
  onDestination: (destination: DestinationShortcut) => void;
};

export default function TacticalPanel({ now, onStation, onDestination }: Props) {
  const [destination, setDestination] = useState('Renaissance Center Station');
  const [error, setError] = useState(false);
  const moverRunning = peopleMoverServiceRunning(now);
  const qlineRunning = qlineServiceRunning(now);
  const go = () => {
    const query = destination.trim().toLowerCase();
    const shortcut = destinationShortcuts.find((item) => item.name.toLowerCase() === query);
    const station = allTransitStations.find((item) => item.name.toLowerCase() === query);
    if (shortcut) {
      setError(false);
      onDestination(shortcut);
    } else if (station) {
      setError(false);
      onStation(station.id);
    } else setError(true);
  };
  return (
    <section className="tactical-panel" aria-label="Transit status and destination">
      <div className="tactical-panel__status">
        <h2>
          TRANSIT STATUS{' '}
          <span>
            {moverRunning && qlineRunning ? 'WITHIN SCHEDULED HOURS' : 'SERVICE HOURS VARY'}
          </span>
        </h2>
        <p>
          <span>DPM Loop</span>
          <i className={moverRunning ? 'fleet-dot is-operating' : 'fleet-dot'} />
          {moverRunning ? 'Scheduled service' : 'Outside service hours'}
        </p>
        <p>
          <span>QLINE</span>
          <i className={qlineRunning ? 'fleet-dot is-operating' : 'fleet-dot'} />
          {qlineRunning ? 'Scheduled service' : 'Outside service hours'}
        </p>
        <div className="tactical-panel__disclosure">
          <ArrivalEstimateNote />
          <span>No verified live fleet feed</span>
        </div>
      </div>
      <form
        className="tactical-destination"
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
      >
        <label htmlFor="hud-destination">
          Going to:
          <input
            id="hud-destination"
            list="hud-destinations"
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              setError(false);
            }}
            aria-invalid={error}
            aria-describedby={error ? 'hud-destination-error' : undefined}
          />
        </label>
        <datalist id="hud-destinations">
          {[...destinationShortcuts, ...allTransitStations].map((item) => (
            <option key={item.id} value={item.name} />
          ))}
        </datalist>
        <Button type="submit" className="tactical-go bg-go text-go-foreground hover:bg-go/90">
          GO
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="tactical-direction"
          onClick={go}
          aria-label="Navigate to destination"
          title="Navigate to destination"
        >
          <Navigation />
        </Button>
      </form>
      {error && (
        <p id="hud-destination-error" role="alert" className="tactical-error">
          Choose a listed destination or station.
        </p>
      )}
    </section>
  );
}
