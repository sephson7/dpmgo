CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('drawer_open', 'slot_view', 'slot_map', 'slot_visit')),
  station_id text NOT NULL CHECK (station_id ~ '^[a-z0-9-]{2,64}$'),
  slot smallint CHECK (slot IN (1, 2)),
  month text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.analytics_events IS 'Anonymous station drawer opens and sponsor slot events. No personal data. Written and read only by the server.';
CREATE INDEX analytics_events_month_idx ON public.analytics_events (month, kind, station_id);
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.analytics_monthly()
RETURNS TABLE(month text, kind text, station_id text, slot smallint, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT month, kind, station_id, slot, count(*)
  FROM public.analytics_events
  GROUP BY month, kind, station_id, slot;
$$;
REVOKE EXECUTE ON FUNCTION public.analytics_monthly() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_monthly() TO service_role;