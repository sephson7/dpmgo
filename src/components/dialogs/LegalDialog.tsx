import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type LegalDocument = 'terms' | 'privacy' | 'disclaimer';

const DISCLAIMER_COPY =
  'DPM - Go! is an open-source project under Motorcity Automated Systems, LLC and is not associated with the DTC or the official Detroit People Mover entity.';

export type LegalDialogProps = {
  /** The document that is open, if any. */
  document: LegalDocument | null;
  onOpenChange: (open: boolean) => void;
};

/** The terms, privacy and disclaimer documents. */
export default function LegalDialog({ document, onOpenChange }: LegalDialogProps) {
  const title =
    document === 'terms'
      ? 'Terms and Conditions'
      : document === 'privacy'
        ? 'Privacy Policy'
        : 'Disclaimer';

  return (
    <Dialog open={Boolean(document)} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="legal-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Software developed by Motorcity Automated Systems, LLC.
          </DialogDescription>
        </DialogHeader>
        <div className="legal-body">
          {document === 'terms' ? (
            <>
              <p>
                <strong>Disclaimer of Transit Data &amp; Timetables:</strong> DPM - Go! is an
                independent utility created to assist Detroit transit riders. All schedules,
                next-train countdowns, and moving vehicle markers represent published GTFS
                timetables and visual simulations. Motorcity Automated Systems, LLC make no
                guarantee of real-time accuracy and expressly disclaim all liability for transit
                delays, service interruptions, or missed connections.
              </p>
              <p>
                <strong>Third-Party Venues:</strong> Restaurant walking metrics, menus, and external
                links are provided for convenience. Motorcity Automated Systems, LLC does not
                operate or endorse third-party establishments.
              </p>
            </>
          ) : document === 'disclaimer' ? (
            <>
              <p>
                <strong>Disclaimer:</strong> {DISCLAIMER_COPY}
              </p>
              <p>
                <strong>Transit Data &amp; Timetables:</strong> All schedules, next-train countdowns
                and moving vehicle markers represent published GTFS timetables and visual
                simulations. Real-time agency telemetry is currently unavailable from DTC, so no
                arrival estimate in this app is a live feed.
              </p>
              <p>Verify arrival times at displays located at each station.</p>
            </>
          ) : (
            <>
              <p>
                <strong>Privacy Policy:</strong> DPM - Go! does not store your location data or sell
                personal information to third parties. Location permissions are utilized on-device
                solely to calculate walking distances and trigger arrival alerts.
              </p>
              <p>All map telemetry is loaded client-side via Mapbox GL.</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
