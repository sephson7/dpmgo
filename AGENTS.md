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

- Subdirectories have their own `AGENTS.md`; read it before changing files there.
- Keep transit route data and nearby place links in `src/data/transit.ts` so the map and station drawers share one station order.
- Keep the People Mover station order in the agency counter-clockwise direction starting at Times Square, because the loop is served in one direction only; never route a rider backwards around the loop.
- Render Mapbox only after browser hydration because Mapbox GL depends on browser APIs during module evaluation.
- Label animated vehicle positions as simulations until a verified live transit feed is connected, to avoid misleading riders.
- Keep raw rider feedback insert-only and boarding feedback session-scoped; publish only station/day aggregates above a minimum definite-answer threshold, never claim reports calibrate estimates.
- Drive the People Mover simulation along the agency GTFS shape and use platform coordinates as its dwell points.
- Keep fleet timing in a pure simulation module and gate People Mover movement through the shared GTFS service calendar, including after-midnight trips, so movement cannot imply off-hours service.
- Keep People Mover drawer estimates in a browser-safe pure module: the first uses the shared fleet clock, while a clearly labeled follow-up planning window is distinct from vehicle predictions and omitted near service close, so presentation limits never falsify fleet positions or agency departures.
- Gate the QLINE streetcar through the official published hours (Mon-Sat 8:00 AM to midnight, Sun 8:00 AM to 9:00 PM) in `src/data/qlineSchedule.ts`.
- Measure the QLINE headway per direction, because Congress St is a terminus whose departure list holds both directions; a gap measured on the mixed list reports half the real headway.
- Use bundled QLINE GTFS (`npm run build:qline`) for geometry and per-stop trip times in canonical station order, never a free-running cycle; its calendar expired 2025-12-31, so roll the daily pattern forward under published hours and per-direction headways rather than showing stale service.
- Compute vehicle bearings from the current simulation segment and use map-aligned symbols so train icons follow the track through camera rotation and pitch.
- Keep station drawers to a strict two-slot architecture: slot 1 is an annual partner, slot 2 rotates. Slot holders are never repeated in the standard restaurant list.
- Server-price checkout; slot 1 is annual-only, slot 2 allows either plan. Reject mismatches and never restore client pricing tables.
- Create the partner lead from the confirmed payment, not from a form the buyer can abandon, so a paid slot always has something for the team to approve inside the promised 24 hours.
- Never trust a query string for a completed payment: confirm the checkout session with Stripe before showing a receipt.
- Send the partner confirmation from the server exactly once per Stripe session, and keep the webhook and the redirect on the same idempotent path, because a buyer can close the tab before the redirect finishes and must never be emailed twice.
- Verify the Stripe webhook signature over the raw body and read the session back from Stripe, so a forged call cannot invent a purchase.
- Collect the merchant email before the payment, because the confirmation goes out the moment the payment is confirmed and it needs a recipient.
- Keep the partner portal records in the Cloudflare KV namespace, one key per lead and one key per slot, so two approvals never overwrite each other; keep the local file fallback for the runtimes without the binding.
- Find Worker configs through `scripts/lib/worker-config.mjs`, covering both `.output/server` and `dist/server`, so environment-specific paths never break publishing.
- Keep secrets in `.env.local` (gitignored) or the deployment environment; never in `import.meta.env` or a tracked file.
- Share partner email props across components, previews and sends to avoid unchecked `any` data.
- Keep `/sw.js` as a same-path cache-cleanup worker for one release before restoring offline with `vite-plugin-pwa` generateSW; a single guarded browser wrapper must refuse dev, iframe and Lovable previews, so returning devices discard stale app chunks without disturbing messaging workers.
- Exclude platform-generated integrations from lint and formatting, while retaining all checks for application code, because regenerated files do not follow the project's formatter.
- Protect an annual placement's station slot for 12 months from approval in `src/lib/slotExclusivity.ts`, enforced by both the checkout and the admin approval, so a competitor can never displace an annual partner mid-term.
- Require acceptance of the current version in `src/data/merchantAgreement.ts` before checkout, store the version on the Stripe session and lead, and repeat the terms in the confirmation email, so every merchant has a copy of exactly what they agreed to.
- Hold a station slot for 30 minutes once a checkout starts, and block resale while a paid purchase awaits review, in `src/lib/slotExclusivity.ts` and `src/routes/api.checkout.ts`, so two merchants can never pay for the same slot.
- Use a shared browser-safe walking URL helper with explicit walking mode and iOS detection; omit directions for sponsors without verified venue coordinates.
- Keep the one-time local GPS frame separate from drawer selection and manual origins; yield to rider interaction so automatic framing never interrupts navigation.
- Derive sitemap URLs from required route decisions; exclude checkout, redirects, admin and APIs, and omit invented lastmod dates.
- Keep 3D landmarks in `src/data/landmarks3d.ts` as approximate native map geometry without model downloads; reuse venue anchors, CSS material tokens, and narrowly exclude contained stock footprints to keep the corridor lean and avoid doubled buildings.
