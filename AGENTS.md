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
- Measure the QLINE headway per direction, because Congress St is a terminus whose departure list holds both directions; a gap measured on the mixed list reports half the real headway.
- Treat the QLINE GTFS feed as the source of trip geometry and run times only; its calendar expired on 2025-12-31, so the published operating hours and the per-direction headway are the authority for when the line runs and how often.
- Drive QLINE times, run times and street geometry from the bundled agency GTFS feed (`npm run build:qline`), and fall back to the published hours whenever the feed has no service for the date instead of showing stale times.
- Place the QLINE streetcar with the published timetable, not a free running cycle: reconstruct the trips from the feed's per-stop departure times, index them by the canonical station order because the feed lists a service's stops in that service's own order, and roll the published daily pattern forward once the feed calendar expires.
- Compute vehicle bearings from the current simulation segment and use map-aligned symbols so train icons follow the track through camera rotation and pitch.
- Keep station drawers to a strict two-slot architecture: slot 1 is an annual partner, slot 2 rotates. Slot holders are never repeated in the standard restaurant list.
- Sell slot 1 on the annual plan only and slot 2 on either plan; the server owns the price and rejects mismatched purchases.
- Keep the partner checkout server priced and never re-introduce a client side pricing table, because a table is not priced by the server and can sell the monthly plan for the annual only slot 1.
- Create the partner lead from the confirmed payment, not from a form the buyer can abandon, so a paid slot always has something for the team to approve inside the promised 24 hours.
- Never trust a query string for a completed payment: confirm the checkout session with Stripe before showing a receipt.
- Send the partner confirmation from the server exactly once per Stripe session, and keep the webhook and the redirect on the same idempotent path, because a buyer can close the tab before the redirect finishes and must never be emailed twice.
- Verify the Stripe webhook signature over the raw body and read the session back from Stripe, so a forged call cannot invent a purchase.
- Collect the merchant email before the payment, because the confirmation goes out the moment the payment is confirmed and it needs a recipient.
- Keep the partner portal records in the Cloudflare KV namespace, one key per lead and one key per slot, so two approvals never overwrite each other; keep the local file fallback for the runtimes without the binding.
- Keep the compliance footer a short dock on a phone: below 480px the brand tagline and the `·` separators are dropped so the legal links pack into two rows, because the footer is the last thing on the screen and every pixel of it is taken from the map.
- Keep the bottom dock in one wrapper, `.bottom-dock`, so the installed app can turn the launcher, the status strip and the footer into a single glass panel and float the launcher over the map; the browser layout keeps the soft bottom margin it needs for Safari's floating toolbar.
- Treat `display-mode: standalone` and `display-mode: fullscreen` as the same installed app in `src/styles/standalone.css`, because webkit bug 264218 made iOS report the Home Screen app as fullscreen from 16.4 until the behaviour was corrected; the browser layout must stay untouched.
- Never add the home indicator inset on top of the browser margin: the installed dock owns the `env(safe-area-inset-bottom)` once, and the browser footer keeps `calc(14px + env(safe-area-inset-bottom))`, so the two never stack into an empty chin.
- Find the generated Worker config through `scripts/lib/worker-config.mjs` instead of hardcoding a folder, because a local build writes `.output/server/wrangler.json` while a Lovable build writes `dist/server/wrangler.json`; a build step must never fail the publish over a missing config path.
- Keep secrets in `.env.local` (gitignored) or the deployment environment; never in `import.meta.env` or a tracked file.
- Keep the offline service worker in `public/sw.js` honest about what it caches: the app shell, the stylesheets, the station datasets and the icons are cached, and the partner portal, the Stripe checkout, the slot API and the map tiles never are, because they are personal, transactional or third party.
