import { useEffect, useState } from 'react';
import { Check, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { RiderAnswer, RiderFeedbackContext } from '@/data/riderFeedback';

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export default function RiderFeedbackDialog({
  open,
  onOpenChange,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: RiderFeedbackContext | null;
}) {
  const [state, setState] = useState<SaveState>('idle');
  useEffect(() => {
    if (open) setState('idle');
  }, [open]);

  async function submit(answer: RiderAnswer) {
    if (!context || state === 'saving') return;
    setState('saving');
    const { error } = await supabase.from('rider_feedback').insert({
      station_id: context.stationId,
      answer,
      predicted_minutes: Math.round(context.predictedMinutes),
      predicted_at: context.predictionAt,
    });
    setState(error ? 'failed' : 'saved');
  }

  const done = state === 'saved' || state === 'failed';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="legal-dialog rounded-lg">
        <DialogTitle className="pr-6 leading-snug">
          {state === 'saved'
            ? 'Thanks for contributing to a better experience!'
            : state === 'failed'
              ? 'Thanks for checking!'
              : 'Did the People Mover arrive on time as the app said?'}
        </DialogTitle>
        <DialogDescription className="leading-relaxed">
          {state === 'saved'
            ? 'Your anonymous answer was saved. Answers are reviewed in aggregate and do not change arrival estimates yet.'
            : state === 'failed'
              ? 'Your answer could not be saved right now. Please try again on a later ride.'
              : `${context?.stationName ?? 'People Mover'} · App estimate before boarding: ${context?.predictedMinutes ?? 0} min.`}
        </DialogDescription>
        {done ? (
          <Button variant="hudActive" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Anonymous: only the station, your answer and the estimate are saved.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="hudActive" disabled={state === 'saving'} onClick={() => submit('yes')}>
                <Check size={14} />
                Yes
              </Button>
              <Button variant="hudOutline" disabled={state === 'saving'} onClick={() => submit('no')}>
                <X size={14} />
                No
              </Button>
              <Button
                variant="hudOutline"
                className="px-2"
                disabled={state === 'saving'}
                onClick={() => submit('not-sure')}
              >
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
