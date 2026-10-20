<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep transit route data and nearby place links in `src/data/transit.ts` so the map and station drawers share one station order.
- Keep the People Mover station order in the agency counter-clockwise direction starting at Times Square, because the loop is served in one direction only; never route a rider backwards around the loop.
- Render Mapbox only after browser hydration because Mapbox GL depends on browser APIs during module evaluation.
- Label animated vehicle positions as simulations until a verified live transit feed is connected, to avoid misleading riders.
- Drive the People Mover simulation along the agency GTFS shape and use platform coordinates as its dwell points.
- Keep fleet timing in a pure simulation module and gate People Mover movement through the shared GTFS service calendar, including after-midnight trips, so movement cannot imply off-hours service.
- Gate the QLINE streetcar through the official published hours (Mon-Sat 8:00 AM to midnight, Sun 8:00 AM to 9:00 PM) in `src/data/qlineSchedule.ts`.
- Drive QLINE times, run times and street geometry from the bundled agency GTFS feed (`npm run build:qline`), and fall back to the published hours whenever the feed has no service for the date instead of showing stale times.
- Compute vehicle bearings from the current simulation segment and use map-aligned symbols so train icons follow the track through camera rotation and pitch.
- Keep station drawers to a strict two-slot architecture: slot 1 is an annual partner, slot 2 rotates. Slot holders are never repeated in the standard restaurant list.
- Sell slot 1 on the annual plan only and slot 2 on either plan; the server owns the price and rejects mismatched purchases.
- Never trust a query string for a completed payment: confirm the checkout session with Stripe before showing a receipt.
- Keep secrets in `.env.local` (gitignored) or the deployment environment; never in `import.meta.env` or a tracked file.
