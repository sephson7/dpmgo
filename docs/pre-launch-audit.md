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
(calendar, per-stop departures, headways) and
`src/data/qlineShape.ts` (the northbound and southbound street alignments).

What the feed changed:

| | Before | From the feed |
| --- | --- | --- |
| Service window | published 8:00 AM – 12:00 AM | **the published hours are the gate** — 8:00 AM – 12:00 AM Mon–Sat, 8:00 AM – 9:00 PM Sun |
| Headway | "every 15 minutes or less" | **every 15 minutes**, measured per direction |
| Station departures | none | real scheduled times with direction |
| Run times | invented | the published per-stop times, 1–4 minutes per stop, 24 minutes end to end |
| Map line | straight hops between stops | the real Woodward alignment |

**Important:** the feed's calendar still ends **2025-12-31**, so for every later
date the app rolls the **published daily pattern** forward and reads that one
schedule everywhere: the vehicle on the map, the service window, the headway and
the per-stop departures in the drawer. The pattern is the agency's own daily
timetable rather than a stale copy of a dated service, so the map and the
readout cannot drift apart. The published operating hours remain the fallback
for a date the agency has published no timetable for at all. Refresh the feed
once the agency publishes a 2026 calendar (or run `npm run build:qline` on a
schedule) and the app switches to real departures automatically.

Two corrections were made to that first reading of the feed, and both matter:

- **The headway is 15 minutes, not 6–9.** Congress St is a terminus, so its
  departure list holds both directions: the northbound departures at
  :00/:15/:30/:45 and the southbound arrivals at :09/:24/:39/:54. Measuring
  the gaps on that mixed list reports half the real headway. The gaps are now
  measured per direction, which is a clean 15 minutes for every regular
  service, and that is what the agency's own live schedule shows.
- **The service window is the published hours, not the pattern's first and
  last trip.** The rolled-forward pattern starts at 7:30 AM, but the agency
  publishes an 8:00 AM opening, so the published hours are the gate and
  nothing is in service before the line opens.

The QLINE feed is a static schedule. There is no GTFS-RT vehicle feed for either
Detroit line, so the streetcar marker on the map remains a simulation.

### The streetcar runs the published timetable

The streetcar is no longer a free running cycle. Every trip of the day is
reconstructed from the feed's own per-stop departure times: the times are split
by direction, paired by trip index and laid out in the canonical station order
(`src/data/transit.ts`). The wall clock then decides which trip is running and
where along the corridor it is, so the vehicle on the map leaves Congress Street
on a published departure, calls at each stop at the published time and stands at
Grand Boulevard on the published arrival.

Two details matter:

- The feed lists the stops of a service **in the order that service runs**, and
  that order differs between services (the weekday service starts at Grand
  Boulevard, the Sunday service at Congress Street). The trips are therefore
  indexed by the canonical station order, never by the feed's key order.
- Once the feed's calendar expires, the **published daily pattern is rolled
  forward**: the most recent recurring pattern for that weekday is used, so the
  streetcar keeps running the timetable the agency publishes instead of standing
  at the terminus. The pattern is resolved once, in
  `src/data/qlineSchedule.ts`, and every reader of the schedule — the map, the
  service window, the headway and the per-stop departures — uses it, so the
  readout and the vehicle on the map always agree. `qlineTripsAt()` reports
  which of the two it used (`feed`, `pattern` or `none`).

Vehicle positions are timetable facts, not decoration, so they keep tracking the
wall clock when the rider prefers reduced motion. The refresh is slowed to once
a second in that case, which leaves the vehicle standing still instead of
gliding along the route, rather than freezing it on a stale position.

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

### The store is Cloudflare KV

The leads and the slot assignments live in a **Workers KV namespace**, bound as
`ANCHOR_STORE`:

| | |
| --- | --- |
| `anchor:lead:<id>` | one merchant intake lead |
| `anchor:assignment:<stationId>:<slot>` | one assigned anchor slot |

KV was chosen over D1 because the data is a small document set that is read
whole and written rarely: there are no queries that need a schema, no joins and
no migrations to maintain. One key per record means two approvals never
overwrite each other, and the app can evolve the records without a migration.
Reads are served from a 20 second snapshot in the isolate, and writes go
through the KV namespace and refresh that snapshot, so the operator's own list
is never stale.

`npm run setup:kv` creates the namespace and records its id in `.env.local`;
the build copies the id into the generated Worker configuration as the binding,
so every deploy carries it. Without the binding the store falls back to a JSON
file and then to memory, so nothing breaks before the namespace exists.

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
| QLINE hours | `src/data/qlineSchedule.test.ts` | the agency timetable once the feed calendar has expired, the service window and headway from it, closed between the last arrival and the first departure, the late run of the previous service day, the published hours fallback, next-departure estimate |
| QLINE timetable | `src/data/qlineSimulation.test.ts` | the trips of the day are the published ones, the times never go backwards along the route, nothing runs before the first departure or after the last |
| QLINE readout | `src/data/qlineSchedule.test.ts` | the scheduled departures of a station, the vehicle on the map, and the running state agree for every minute of the day |
| QLINE motion | `src/data/qlineSimulation.test.ts` | the vehicle paces the corridor, leaves Congress Street on the published departure, stands at Grand Boulevard on the published arrival, runs the southbound back down Woodward, stays on Woodward and parks at the terminus while the line is closed |
| Parking | `src/data/parking.test.ts` | every garage anchored to a station, walk order, park-once filtering |
| Merchant intake | `src/data/merchantIntake.test.ts` | required fields, slot values, receipt id |
| Stripe | `src/lib/stripe.test.ts` | slot/plan rules, published prices, price discovery, session creation, paid-session verification, plan mismatch flagging, Stripe failure handling |
| Partner portal auth | `src/lib/adminAuth.test.ts` | the portal fails closed without secrets, credential checks, signed session round trip, forged and tampered tokens |
| Partner portal store | `src/lib/anchorStore.test.ts` | the leads and the slots are written to the KV namespace under one key each, a status change is persisted, one slot per station, the records survive a restart of the runtime, and the local fallback still works without the binding |
| Homepage layout | `src/routes/index.test.tsx` | the phone renders the Quick Routes menu and the bottom dock, the desktop renders the preset pills and the side directory, and the phone never mounts the desktop directory |
| Home strip | `src/components/hud/HomeStrip.test.tsx` | the departure leads, the service state is reported when the line is closed, a partner only appears when its slot is filled, every item opens its station, and the strip rotates |

Rows for `transit.test.ts`, `parking.test.ts`, `merchantIntake.test.ts` and
`stripe.test.ts` describe suites that are **not in the repository yet** — the
coverage is planned, not shipped.

### Stylesheets

`src/styles.css` is only the entry point. The styles live in `src/styles/`:
`tokens.css`, `base.css`, `hud.css`, `drawers.css`, `dialogs.css` and
`responsive.css`. The responsive file holds every breakpoint in the order they
apply and is imported last, so its overrides always win. The duplicated Quick
Navigation block and 65 rules for elements that no longer exist were removed,
and the old `700px` tier was folded into `768px` to match the phone layout.

`npx tsc --noEmit` is clean, `npx vitest run` is green (61 tests) and
`npx vite build` succeeds.

### Continuous integration

`.github/workflows/pull-request.yml` runs on every pull request and on every
push to `main`: lint, format check, type check, the contrast audit, the test
suite and a production build. The build needs no secrets, so the workflow
runs on forks. The nightly `refresh-transit-data.yml` workflow still refreshes
the bundled GTFS calendars and commits them.

The repository is now Prettier clean with the checked in configuration. The
hand written HUD stylesheet and the vendored shadcn kit are excluded from the
format check so they keep their own layout.

---

## 5. Gaps that still block a public launch

### 5.1 Blocking

1. **Deploy the secrets.** `STRIPE_SECRET_KEY` (the restricted key) must be set as
   a deployment secret, not only in `.env.local`. The local file is gitignored and
   was never committed. Also set `PUBLIC_APP_URL` so the redirect URLs point at
   the real domain.
2. **Create the KV namespace.** The store is bound to a Workers KV namespace
   (`ANCHOR_STORE`) and the code is in place, but the namespace has to be
   created on the account before the approvals are durable: run
   `npm run setup:kv`, then `npm run build` and redeploy. Until that happens the
   Worker keeps the in-memory fallback and approvals are lost on a restart.
3. **Slot enforcement lives in code, not in the admin UI.** The admin portal can
   assign a slot, but there is no expiry handling for the rotating slot and no
   check that a merchant holds only one slot at a time.
4. **One shared admin account.** The portal now fails closed with no default
   credentials, but it is still a single operator account over one password.
   Serve it over HTTPS and add per-operator accounts before it handles real
   customers.

### 5.2 Should fix before launch

5. **The QLINE feed is stale.** Its calendar ends 2025-12-31, so the app rolls the
   published daily pattern forward for every later date: the streetcar, the
   service window, the headway and the per-stop times all follow the pattern the
   agency published, but the feed itself cannot confirm the dates. Ask
   Trillium/RTA for a 2026 calendar, then run `npm run build:qline` and the app
   switches to the dated feed automatically.
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
15. The QLINE streetcar is anchored to the published timetable, but the drawer's
    "next stop" readout still shows the terminus wrap. The real fleet runs four
    streetcars; the timetable now says which of them is running, so the marker
    could be labelled with the trip it represents.

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
| `CLOUDFLARE_KV_ANCHOR_STORE_ID` | the partner portal store | yes for a durable store (set by `npm run setup:kv`) |
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
- The QLINE streetcar is placed by the published timetable, never by a free
  running cycle. The trips are indexed by the canonical station order, because
  the feed lists the stops of a service in the order that service runs. The
  schedule is resolved once per date — the dated feed service, or the published
  daily pattern rolled forward once the calendar expires — and the map, the
  service window, the headway and the drawer all read that same schedule.
- The partner portal records live in the KV namespace, one key per lead and one
  key per slot, so two approvals never overwrite each other.
- Every station drawer shows exactly two sponsor slots, and slot holders never
  repeat in the standard restaurant list.
- Prices are decided on the server. The browser never sets an amount.
- Slot 1 is sold on the annual plan only, slot 2 on either plan.
