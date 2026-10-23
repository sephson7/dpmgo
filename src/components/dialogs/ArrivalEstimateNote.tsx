import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ArrivalEstimateNote() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="h-auto max-w-full gap-1 whitespace-normal p-0 text-[10px] leading-tight text-primary"
          aria-label="Arrivals are Estimated — read explanation"
        >
          <span>Arrivals are Estimated</span>
          <Info className="shrink-0" size={12} />
        </Button>
      </DialogTrigger>
      <DialogContent className="legal-dialog rounded-lg">
        <DialogTitle className="pr-6">Arrivals are Estimated</DialogTitle>
        <DialogDescription className="leading-relaxed">
          People Mover arrival estimates are based on scheduled service and a simulated route model,
          not live vehicle tracking. The first estimate follows that model; the second is a 15–20
          minute planning window, not a confirmed departure. A verified public live feed from the
          Detroit Transit Corporation (DTC) is not connected to DPM - Go!.
        </DialogDescription>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Vehicle positions on the map are simulated. Rider feedback is saved anonymously but is not
          yet used to calculate arrivals. Check station displays for current information.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong>Do not rely on DPM - Go! for the last train of the night, time-critical trips or
          your safety.</strong>{' '}
          Plan extra time near closing, confirm service with station displays or DTC staff, and in
          an emergency call 911.
        </p>
      </DialogContent>
    </Dialog>
  );
}
