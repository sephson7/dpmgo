CREATE OR REPLACE FUNCTION public.rider_report_summary(p_station_id text)
RETURNS TABLE(report_day date, yes_count bigint, no_count bigint, unsure_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (now() AT TIME ZONE 'America/Detroit')::date,
    count(*) FILTER (WHERE answer = 'yes'),
    count(*) FILTER (WHERE answer = 'no'),
    count(*) FILTER (WHERE answer = 'not-sure')
  FROM public.rider_feedback
  WHERE station_id = p_station_id
    AND created_at >= ((now() AT TIME ZONE 'America/Detroit')::date::timestamp AT TIME ZONE 'America/Detroit')
    AND created_at < (((now() AT TIME ZONE 'America/Detroit')::date + 1)::timestamp AT TIME ZONE 'America/Detroit')
  HAVING count(*) FILTER (WHERE answer IN ('yes', 'no')) >= 5;
$$;
REVOKE ALL ON FUNCTION public.rider_report_summary(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rider_report_summary(text) TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.rider_report_summary(text) IS 'Public Detroit-day aggregate only; suppress fewer than five definite answers. Raw feedback remains insert-only for riders. Self-reports are not verified service performance.';