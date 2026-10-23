import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { riderSummaryStats, type RiderSummary } from '@/data/riderSummary';

export default function RiderReportSummary({ stationId }: { stationId: string }) {
  const [result, setResult] = useState<{ stationId: string; summary: RiderSummary | null } | null>(
    null,
  );
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const { data, error } = await supabase.rpc('rider_report_summary', {
          p_station_id: stationId,
        });
        if (active) setResult(error ? null : { stationId, summary: data?.[0] ?? null });
      } catch {
        if (active) setResult(null);
      } finally {
        inFlight = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    window.addEventListener('dpm-rider-feedback-saved', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('dpm-rider-feedback-saved', refresh);
    };
  }, [stationId]);

  // Never carry another station's results into this drawer or invent a fallback percentage.
  if (!result || result.stationId !== stationId) return null;
  const stats = riderSummaryStats(result.summary);
  return (
    <div className="rider-report-summary">
      <div className="flex items-center gap-2 text-xs text-primary">
        <Users size={14} className="shrink-0" />
        <span>
          {stats ? `${stats.percent}% reported on time · today` : 'Not enough rider reports today'}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        {stats
          ? `${stats.definite} Yes/No answers at this station${stats.unsure ? ` · ${stats.unsure} unsure, excluded` : ''}. `
          : ''}
        Anonymous, unverified self-reports · not live tracking or a change to estimates.
      </p>
    </div>
  );
}
