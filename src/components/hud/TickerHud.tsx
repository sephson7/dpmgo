import { Timer } from 'lucide-react';
import { QLINE_HEADWAY_MINUTES } from '@/data/qlineSchedule';
import type { TickerState } from './types';

export type TickerHudProps = {
  ticker: TickerState;
};

/**
 * The cadence readout for the selected station. The People Mover branch
 * follows the drawn fleet, so the countdown and the vehicle on the map always
 * agree.
 */
export default function TickerHud({ ticker }: TickerHudProps) {
  const { station, isQLine, schedule, arrival, qline } = ticker;
  const live = isQLine || schedule.running;

  return (
    <div className="homepage-ticker-hud" role="status" aria-live="polite">
      <div className="ticker-hud-header">
        <span className="ticker-hud-kicker">
          <Timer size={11} className={live ? 'text-primary' : 'text-muted-foreground'} />
          {isQLine ? 'STREETCAR FREQUENCY' : 'SIMULATED LOOP CADENCE'}
        </span>
        <span className="ticker-hud-target">{station.name}</span>
      </div>
      <div className="ticker-hud-display">
        <span className={`ticker-hud-indicator ${live ? 'is-live' : 'is-off'}`} />
        <span className="ticker-hud-countdown">
          {isQLine ? (
            qline.running ? (
              <>
                HEADWAY: <strong>{QLINE_HEADWAY_MINUTES}</strong> MIN{' '}
                <small>({qline.nextDepartureLabel})</small>
              </>
            ) : (
              <>
                <span className="ticker-off-hours">SERVICE SUSPENDED</span>{' '}
                <small>({qline.nextDepartureLabel})</small>
              </>
            )
          ) : schedule.running ? (
            arrival.atPlatform ? (
              <strong className="ticker-due-now">DUE AT PLATFORM</strong>
            ) : (
              <>
                IN <strong>{arrival.minutes}</strong> MIN <small>(SIMULATED)</small>
              </>
            )
          ) : (
            <span className="ticker-off-hours">SERVICE SUSPENDED (OFF-HOURS)</span>
          )}
        </span>
      </div>
    </div>
  );
}
