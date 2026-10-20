# Pre-launch audit — DPM - Go!

Audit date: 2026-10-20 · Scope: `src/data`, `src/components/TransitMap.tsx`, `src/routes/index.tsx`,
`src/routes/pricing.tsx`, `src/routes/admin.tsx`, `src/routes/api.*`, `src/lib/*`.

---

## 1. Loop direction — confirmed

The People Mover is a **single counter-clockwise circuit**. The station order in
`src/data/transit.ts` matches the agency GTFS shape (`qo5n`) and the GTFS stop
sequence exactly:

```
Times Square -> Michigan -> Fort/Cass -> Huntington Place -> Water Square ->
Financial District -> Millender -> Renaissance Center -> Bricktown ->
Greektown -> Cadillac Center -> Broadway -> Grand Circus Park -> Times Square
```

Verification: the bundled `src/data/dpmSchedule.json` lists departures in that same
key order, and `src/data/peopleMoverShape.ts` starts at the Times Square coordinate.
The array is the single source of truth for the map, the drawer numbering, the
routing engine and the simulation dwell order.

Routing, dwell points, arrival countdowns and vehicle markers all move in that one
direction. `calculateFlexibleRoute` never offers a backwards ride, because a
backwards ride does not exist.

---

## 2. Transit data sources — confirmed constraints

**There is no public live GTFS feed for the Detroit People Mover.** Every arrival
time in the app comes from the bundled public schedule
(`src/data/dpmSchedule.json`, generated from the DTC GTFS feed) and the timetable
shown in the station drawer. Vehicle markers are a simulation and are labelled as
such in the HUD, the drawer disclaimer and the map legend.

The People Mover GTFS calendar that is bundled ends **2026-12-31**. After that date
the app reports "service suspended" for every People Mover station instead of
implying service that is not scheduled. A build step that refreshes
`dpmSchedule.json` from `https://hosted-gtfs-feeds.s3.amazonaws.com/DPM/gtfs.zip`
is the only maintenance needed to keep the times current.

### QLINE feed

An official QLINE GTFS feed is published by Trillium Solutions for the RTA:

```
https://data.trilliumtransit.com/gtfs/qline-mi-us/qline-mi-us.zip
```

`npm run build:qline` downloads it and regenerates `src/data/qlineSchedule.json`
(calendar, per-stop departures, per-leg run times, headways) and
`src/data/qlineShape.ts` (the northbound and southbound street alignments).

What the feed changed:

| | Before | From the feed |
| --- | --- | --- |
| Service window | published 8:00 AM – 12:00 AM | **7:30 AM – 12:20 AM** Mon–Sat, 7:30 AM – 9:20 AM Sun |
| Headway | "every 15 minutes or less" | **every 6–9 minutes** |
| Station departures | none | real scheduled times with direction |
| Run times | invented | 1–4 minutes per stop, 24 minutes end to end |
| Map line | straight hops between stops | the real Woodward alignment |

**Important:** the feed's calendar still ends **2025-12-31**, so for any date in
2026 the app has no scheduled service to read and falls back to the published
operating hours. That fallback is deliberate — showing 2025 times as if they were
today's would be worse than the published hours. Refresh the feed once the
agency publishes a 2026 calendar (or run `npm run build:qline` on a schedule) and
the app switches to real departures automatically.

The QLINE feed is a static schedule. There is no GTFS-RT vehicle feed for either
Detroit line, so the streetcar marker on the map remains a simulation.

---

## 3. Monetization: pricing, slots and the admin portal

### Published plans

| Plan | Price | Stripe price id |
| --- | --- | --- |
| Monthly | $375 / month | `price_1UQ8gh57MO63Hzo1BK7DIYts` |
| Annual | $1,875 / year | `price_1UQ8hd57MO63Hzo1Jh3tkuqf` |

Both prices are recurring, so the Checkout Session is created in **subscription
mode**. The old $2,400 / $600 inline price schema has been removed.

### Slot assignment rules

| Slot | Type | Plans accepted |
| --- | --- | --- |
| Slot 1 | Annual partner | Annual only |
| Slot 2 | Rotating partner | Monthly **and** annual |

The rule is enforced on the server (`src/lib/stripe.ts` → `SLOT_PLAN_RULES`):
a Slot 1 purchase on the monthly plan is rejected with a 400 before Stripe is
called, and a purchase that slips through the pricing table is flagged by the
verification endpoint (`slotPlanAllowed: false`) so the confirmation screen can
warn the operator.

Slot 1 of Fort / Cass is held by **Lafayette Coney Island**. Every other slot in
every station drawer is open and shows the "CLAIM SLOT" call to action.

### Stripe wiring

- The pricing table embed on `/pricing` is unchanged
  (`prctbl_1UQ9Ky57MO63Hzo12cFECrWf` + publishable key) and now carries a
  `client-reference-id` of `{stationId}|{slot}` so the resulting session is
  attributed to the station and slot the buyer picked.
- `/api/checkout` creates the session server-side with the published price id,
  the station/slot metadata and the `success_url` / `cancel_url` redirects.
- The confirmation screen **verifies the payment with Stripe**
  (`GET /api/checkout?session_id=…`). A `?success=true` query parameter is no
  longer trusted.
- The key in use is a **restricted key** (`rk_live_…`). It can read products and
  prices but **not** pricing tables, so the price ids are discovered from the
  price catalogue and can also be pinned with `STRIPE_PRICE_ANNUAL` /
  `STRIPE_PRICE_MONTHLY`.

### Admin portal

`/admin` (linked from the app footer) signs in with the deployment's
`ADMIN_USERNAME` / `ADMIN_PASSWORD` and lets an operator:

- read every merchant intake submission (point of contact, business, email, deal,
  requested station and slot, plan),
- approve a lead, which writes the anchor slot assignment,
- reject a lead,
- review the slots that are currently assigned.

Assignments are published to the public app through `/api/anchor-slots` and take
priority over the built-in slot registry, so an approved purchase shows up in the
station drawer without a redeploy.

**The portal fails closed.** There are no default credentials: if
`ADMIN_USERNAME`, `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` is missing from the
deployment, `/admin` and the `/api/admin/*` routes answer `503` and the portal
cannot be reached. The session cookie is signed with `ADMIN_SESSION_SECRET`
only, never with a value derived from the password, so a leaked password cannot
be turned into a forged session.

**Still open:** there is no refund path, no receipt email and no renewal handling
for the rotating slot. The credentials are still one shared operator account and
should be replaced by per-operator accounts before the portal carries real
customers.

---

## 4. What is covered by tests

| Area | File | What it locks down |
| --- | --- | --- |
| Station order & anchors | `src/data/transit.test.ts` | loop order, unique ids, guides anchored to real stations, radius, routing legs |
| Routing | `src/data/transit.test.ts` | hotel / Canada / shortcut / station targets, single-direction loop legs, QLINE corridor legs, Grand Circus transfer, GPS boarding, unknown-id fallback, zero-stop trip |
| Fleet simulation | `src/data/trainSimulation.test.ts` | 14.5 min loop, 7.25 min headway, two two-car consists, dwell then move, bearing alignment, platform dwell points, arrival telemetry matches the drawn train, published speed and acceleration limits, moving-block separation, service-hours gate |
| QLINE hours | `src/data/qlineSchedule.test.ts` | Mon–Sat 08:00–24:00, Sun 08:00–21:00, closed overnight, next-departure estimate |
| QLINE motion | `src/data/qlineSimulation.test.ts` | vehicle paces the corridor, dwells, stays on Woodward, parks at the terminus |
| Parking | `src/data/parking.test.ts` | every garage anchored to a station, walk order, park-once filtering |
| Merchant intake | `src/data/merchantIntake.test.ts` | required fields, slot values, receipt id |
| Stripe | `src/lib/stripe.test.ts` | slot/plan rules, published prices, price discovery, session creation, paid-session verification, plan mismatch flagging, Stripe failure handling |
| Partner portal auth | `src/lib/adminAuth.test.ts` | the portal fails closed without secrets, credential checks, signed session round trip, forged and tampered tokens |
| Homepage layout | `src/routes/index.test.tsx` | the phone renders the Quick Routes menu and the bottom dock, the desktop renders the preset pills and the side directory, and the phone never mounts the desktop directory |

Rows for `transit.test.ts`, `qlineSchedule.test.ts`, `qlineSimulation.test.ts`,
`parking.test.ts`, `merchantIntake.test.ts` and `stripe.test.ts` describe suites
that are **not in the repository yet** — the coverage is planned, not shipped.

`npx tsc --noEmit` is clean, `npx vitest run` is green (35 tests) and
`npx vite build` succeeds.

---

## 5. Gaps that still block a public launch

### 5.1 Blocking

1. **Deploy the secrets.** `STRIPE_SECRET_KEY` (the restricted key) must be set as
   a deployment secret, not only in `.env.local`. The local file is gitignored and
   was never committed. Also set `PUBLIC_APP_URL` so the redirect URLs point at
   the real domain.
2. **No durable store on the edge runtime.** Anchors and leads are written to
   `data/anchor-store.json` when the runtime has a filesystem, and to memory
   otherwise. On Cloudflare Workers that means approvals are lost on a restart
   and are not shared between instances. Bind a KV or D1 namespace and point
   `src/lib/anchorStore.ts` at it.
3. **Slot enforcement lives in code, not in the admin UI.** The admin portal can
   assign a slot, but there is no expiry handling for the rotating slot and no
   check that a merchant holds only one slot at a time.
4. **One shared admin account.** The portal now fails closed with no default
   credentials, but it is still a single operator account over one password.
   Serve it over HTTPS and add per-operator accounts before it handles real
   customers.

### 5.2 Should fix before launch

5. **The QLINE feed is stale.** Its calendar ends 2025-12-31, so the app falls back to
   the published hours for every 2026 date. Ask Trillium/RTA for a 2026 calendar, then
   run `npm run build:qline`. Until then the drawer shows published hours rather than
   a timetable for QLINE stops.
6. **Restaurant photography is incomplete.** 23 of 32 venues have a local photo in
   `src/assets/dining/`. Missing: `brushpark-brunch`, `grey-ghost`, `bar-pigalle`,
   `bodega`, `jolly-pumpkin`, `chartreuse`, `whitney`, `baobab-fare`, `marrow`.
   These fall back to the venue's favicon. Secure licensed photography first.
7. **Parking data is approximate.** Entrance coordinates and hours come from public
   directory data and drift. The drawer states "confirm on arrival", but a review
   with the City of Detroit Municipal Parking Department is advisable. The QLINE
   park-and-ride (Wayne State Lot 12) should be re-confirmed each season.
8. **The rider alarm uses raw GPS distance**, not the direction of travel or the
   platform. It can fire while the rider walks past the station on another street.
   It also needs location permission; a denial is now surfaced as "GPS UNAVAILABLE".
9. **The "next stop" readout for the QLINE** shows the terminus wrap (Grand
   Boulevard → Congress Street). That matches the turnaround, but the label should
   say "turns around" on the last stop.
10. **Accessibility gaps:** the 3D map has no keyboard equivalent for the station
   pins, and the HUD relies on cyan/amber contrast that should be re-checked with
   a contrast audit. Confirm focus trapping and screen reader labels on the
   drawer and on the new admin page.
11. **No fallback when WebGL or the Mapbox token is unavailable.** The map shows
    the placeholder grid while the rest of the app keeps working; consider an
    explicit message.
12. **The pricing table cannot be filtered per slot.** Slot 1 rejects a monthly
    purchase at the server, but the buyer can still pick the wrong option on the
    table before that. Two separate pricing tables (one per slot) would remove
    the mismatch entirely.

### 5.3 Nice to have

12. Performance: every GPS update re-renders the map component. Throttle the
    position state to 1 Hz for the map while keeping the alert logic responsive.
13. The station drawer re-computes `nearbyRestaurants` per station and now also
    does a parking distance sweep. Both are small but could be memoised per
    station id.
14. The 3D parking layer has no extrusion; the garage pins are flat circles.
15. The QLINE model runs a single vehicle pair; the real fleet runs four
    streetcars, so the corridor period could be modelled from the timetable.
16. The QLINE streetcar is still a free-running cycle. Unlike the People
    Mover, its position is not anchored to the published corridor timetable, so
    the drawn streetcar and the published departure times are independent. The
    People Mover fleet is anchored to its service window and its readout shares
    that clock, so the two always agree.

---

## 6. Environment variables

| Variable | Used by | Required |
| --- | --- | --- |
| `VITE_MAPBOX_TOKEN` | Mapbox canvas | yes (a public token is hard-coded as a fallback) |
| `STRIPE_SECRET_KEY` | `/api/checkout` | yes for paid checkout |
| `STRIPE_PRICING_TABLE_ID` | `/api/checkout` | recommended |
| `STRIPE_PRICE_ANNUAL` | `/api/checkout` (slot 1) | recommended |
| `STRIPE_PRICE_MONTHLY` | `/api/checkout` (slot 2) | recommended |
| `PUBLIC_APP_URL` | redirect URLs | recommended |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `/admin` | yes (the portal is closed without them) |
| `ADMIN_SESSION_SECRET` | session cookie signing | yes (the portal is closed without it) |
| `MERCHANT_INTAKE_WEBHOOK_URL` | `/api/merchant-intake` | optional |

---

## 7. Rules to keep

- One station order for the map, the drawer numbering, the routing engine and the
  simulation — `src/data/transit.ts` owns it.
- The phone and the desktop render different trees from the same state. Do not
  go back to hiding the desktop layout with `display: none`; the phone must not
  mount the 25 button directory.
- The route files stay thin. Presentation lives in `src/components/`.
- The People Mover runs counter-clockwise only; never route backwards around the loop.
- Vehicle markers stay labelled as simulations: there is no live People Mover feed.
- The map and the arrival readout share one fleet clock, so the vehicle on the
  map is always the vehicle the countdown is counting down.
- The agency timetable wins over the free-running fleet specification: the
  published 14.5 minute circuit and 15 second dwell are the schedule, and the
  38 mph top speed and 3.5 ft/s² acceleration are the limits the fleet is held to.
- Both lines stay gated by their published service windows.
- Every station drawer shows exactly two sponsor slots, and slot holders never
  repeat in the standard restaurant list.
- Prices are decided on the server. The browser never sets an amount.
- Slot 1 is sold on the annual plan only, slot 2 on either plan.
