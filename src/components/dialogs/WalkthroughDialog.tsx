import { Bell, Clock3, Compass, LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export type WalkthroughDialogProps = {
  open: boolean;
  /** Closes the guide. `permanently` also stops it from opening again. */
  onDismiss: (permanently: boolean) => void;
  dontShowAgain: boolean;
  onDontShowAgainChange: (value: boolean) => void;
};

/** The first run guide for riders. */
export default function WalkthroughDialog({
  open,
  onDismiss,
  dontShowAgain,
  onDontShowAgainChange,
}: WalkthroughDialogProps) {
  return (
    <Dialog open={open} onOpenChange={next => !next && onDismiss(false)}>
      <DialogContent className="walkthrough-dialog">
        <div className="walkthrough-header">
          <div className="walkthrough-eyebrow">
            <Compass size={13} />
            <span>RIDER QUICK GUIDE</span>
          </div>
          <DialogTitle>How DPM - Go! Works</DialogTitle>
          <DialogDescription className="walkthrough-subtitle">
            Your lightweight companion for navigating the Detroit People Mover &amp; QLINE transit corridors.
          </DialogDescription>
        </div>

        <div className="walkthrough-body">
          <div className="walkthrough-step">
            <div className="walkthrough-step-icon">
              <Compass size={18} />
            </div>
            <div className="walkthrough-step-content">
              <div className="walkthrough-step-title">1. Interactive 3D Transit Map</div>
              <p className="walkthrough-step-desc">
                Tap any station node on the map or tap <strong>STATIONS</strong> to view scheduled departures, elevator accessibility status, and walking wayfinding.
              </p>
            </div>
          </div>

          <div className="walkthrough-step">
            <div className="walkthrough-step-icon">
              <LocateFixed size={18} />
            </div>
            <div className="walkthrough-step-content">
              <div className="walkthrough-step-title">2. "Boarded" GPS Following</div>
              <p className="walkthrough-step-desc">
                Riding the train? Tap <strong>BOARDED</strong> in the top bar to follow your GPS movement along the elevated track loop directly in your browser.
              </p>
            </div>
          </div>

          <div className="walkthrough-step">
            <div className="walkthrough-step-icon">
              <MapPin size={18} />
            </div>
            <div className="walkthrough-step-content">
              <div className="walkthrough-step-title">3. Station Anchors &amp; Local Dining</div>
              <p className="walkthrough-step-desc">
                Discover top-rated Detroit eateries and exclusive rider perks near every stop. Tap <strong>SHOW ON 3D MAP</strong> on any restaurant to spotlight its pin on the 3D grid.
              </p>
            </div>
          </div>

          <div className="walkthrough-step">
            <div className="walkthrough-step-icon">
              <Bell size={18} />
            </div>
            <div className="walkthrough-step-content">
              <div className="walkthrough-step-title">4. Proximity Station Alerts</div>
              <p className="walkthrough-step-desc">
                Tap <strong>NOTIFY ON ARRIVAL</strong> inside any station card. DPM - Go! will chime and vibrate your device as your train approaches your destination.
              </p>
            </div>
          </div>

          <div className="walkthrough-step">
            <div className="walkthrough-step-icon">
              <Clock3 size={18} />
            </div>
            <div className="walkthrough-step-content">
              <div className="walkthrough-step-title">5. Headways &amp; Scheduled Loop Cadence</div>
              <p className="walkthrough-step-desc">
                Next-train countdowns follow published headway schedules (every 4–6 mins). Moving trains on the 3D map are simulated to visualize loop cadence.
              </p>
            </div>
          </div>
        </div>

        <div className="walkthrough-footer">
          <label className="walkthrough-opt-out">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => onDontShowAgainChange(e.target.checked)}
            />
            <span>Don't show this guide automatically on startup</span>
          </label>

          <div className="walkthrough-actions">
            <Button type="button" variant="outline" size="sm" onClick={() => onDismiss(false)}>
              Close
            </Button>
            <Button type="button" variant="hudActive" size="sm" onClick={() => onDismiss(true)}>
              Got It, Let's Ride!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
