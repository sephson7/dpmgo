import { useEffect, useState } from 'react';
import { Check, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { RiderAnswer, RiderFeedbackContext } from '@/data/riderFeedback';

export default function RiderFeedbackDialog({
  open,
  onOpenChange,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: RiderFeedbackContext | null;
}) {
  const [answer, setAnswer] = useState<RiderAnswer | null>(null);
  useEffect(() => {
    if (open) setAnswer(null);
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="legal-dialog rounded-lg">
        <DialogTitle className="pr-6 leading-snug">
          {answer ? 'Thanks for checking!' : 'Did the People Mover arrive on time as the app said?'}
        </DialogTitle>
        <DialogDescription className="leading-relaxed">
          {answer
            ? 'Your answer has not been saved. Rider feedback collection is temporarily unavailable.'
            : `${context?.stationName ?? 'People Mover'} · App estimate before boarding: ${context?.predictedMinutes ?? 0} min.`}
        </DialogDescription>
        {answer ? (
          <Button variant="hudActive" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Answers cannot yet be saved and do not change arrival estimates.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="hudActive" onClick={() => setAnswer('yes')}>
                <Check size={14} />
                Yes
              </Button>
              <Button variant="hudOutline" onClick={() => setAnswer('no')}>
                <X size={14} />
                No
              </Button>
              <Button variant="hudOutline" className="px-2" onClick={() => setAnswer('not-sure')}>
                <HelpCircle size={14} />
                Not sure
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
