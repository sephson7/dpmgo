CREATE TABLE public.rider_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text NOT NULL CHECK (char_length(station_id) BETWEEN 1 AND 64),
  answer text NOT NULL CHECK (answer IN ('yes','no','not-sure')),
  predicted_minutes integer NOT NULL CHECK (predicted_minutes BETWEEN 0 AND 120),
  predicted_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.rider_feedback TO anon, authenticated;
GRANT ALL ON public.rider_feedback TO service_role;
ALTER TABLE public.rider_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit rider feedback" ON public.rider_feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX rider_feedback_station_created_idx ON public.rider_feedback (station_id, created_at);