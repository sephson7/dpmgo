
```markdown
# DPM - Go!

**DPM - Go!** is an advanced, mobile-first downtown transit utility application engineered for **Motorcity Automated Systems**. Designed specifically to remove friction from urban mobility, the app unifies Detroit's core transit arteries—the 2.9-mile elevated Detroit People Mover (DPM) loop and the QLine streetcar corridor—into a singular, zero-friction interface. 

The core mission of DPM - Go! is to encourage visitors, commuters, and residents to "park once" (or ditch personal vehicles entirely) and explore downtown destinations, local dining, and major sports/entertainment events completely on foot.

---

## 🏗️ Version Evolution & Architecture

### Version 3.0.0 (The Unified Transit & Discovery Update)
- **Anchor Slots for Local Restaurants:** Features dedicated anchor slots mapping verified high-rating local dining options to specific stations.
- **Opt-Out How It Works Demo:** Includes a brief, intuitive onboarding walkthrough demo that users can easily skip or opt out of for instant launch.
- **QLine Station Drawers & Local Spots:** The QLine corridor now features its own dedicated station drawers and curated local spots, matching the robust functionality of the People Mover loop.
- **Downtown Activities & Sports Integration:** Added streamlined, direct access to downtown activities, entertainment schedules, and major sports events.
- **"Set Alarm" Proximity Notification:** Introduced a new "Set alarm" function that alerts and notifies users when they are approaching their target station.

### Version 2.0.0 (Live Data-Driven Evolution)
- **Live Arrival Countdown Clocks:** Direct data integration for exact vehicle tracking and accurate countdown timers.
- **Dynamic City Event & Sports Integrations:** Live API schedule connections for venue hubs like Ford Field, Comerica Park, Little Caesars Arena, and Hart Plaza to automatically highlight surrounding station congestion.
- **ADA Accessibility & Station Status Alerts:** Real-time platform accessibility tracking, including elevator and escalator operational status badges.
- **"Park Once" Impact & Carbon Calculator:** An urban mobility widget tracking money saved on parking fees alongside foot-traffic step count and carbon footprint reduction.

### Version 1.0.0 (Initial Public Release)
- **Sci-Fi HUD Canvas:** Custom dark-mode interface (`#070B14`), 3D isometric building extrusions (such as the Renaissance Center), and glowing neon-cyan transit loops (`#00F0FF`).
- **Zero-Login Friction:** Instantaneous mobile launch without requiring user accounts, password walls, or onboarding friction.
- **Station Infrastructure:** Mapped official Detroit People Mover stations in sequential order.

---

## 🚀 Core Architectural Pillars

### 1. UI & Visual Architecture
- **Theme & Aesthetic:** High-contrast urban transport HUD with deep charcoal/navy backgrounds (`#070B14`), glowing neon-cyan transit lines (`#00F0FF`), and frosted glassmorphism containers (`backdrop-blur-xl bg-slate-900/80 border border-cyan-500/30`).
- **Header & Navigation:** Pill-style live toggle switches for **"PEOPLE MOVER"** and **"QLINE"**, alongside a top dropdown menu for activity calendars, sports schedules, and event feeds.
- **Quick Routes Presets:** The **"HOW DO I?"** and **"I'M GOING TO:"** presets are one row of pills on a desktop and a single **"QUICK ROUTES!"** dropdown in the header on a phone, where the two rows of pills cannot fit above the map.
- **Phone Layout (`<= 768px`):** The floating HUD keeps the countdown, the boarded/follow toggles and the line switches over the map; the station directory moves to a **STATIONS** bottom-sheet launcher; the reset control, the map legend and the legal footer stack into one bottom dock that never overlaps the map.
- **Reset Map View:** The map control returns the camera to the downtown overview and clears every marked location (the quick route pin, the restaurant pin and the selected station).

### 2. 3D Satellite Map Canvas & Telemetry
- **Mapbox Integration:** Initialized using `mapbox://styles/mapbox/satellite-streets-v12`. Centered on downtown Detroit (`[-83.0458, 42.3314]`) with a zoom of `15.5`, a pitch of `50` degrees, and a bearing of `-20` degrees for 3D isometric building extrusions.
- **Vehicle Simulation & Tracking:** Interactive tracking dots that pace smoothly along the single-track loop and QLine corridor with station stops and arrival sync.

### 2a. People Mover Fleet Simulation
The People Mover vehicles are a **simulation**, never a live feed, and the
simulation follows the published fleet specification and the agency timetable:

| Rule | Value | Source |
| --- | --- | --- |
| Circuit time | 14.5 min (870 s) | agency timetable |
| Platform dwell | 15 s | agency timetable |
| Track length | 2.94 mi (the GTFS shape measures 2.87 mi) | fleet specification |
| Average speed | 11.9 mph over the circuit (11.7 mph published) | fleet specification |
| Top operating speed | 38 mph limit, 24 mph reached on the straight | fleet specification |
| Acceleration | 3.5 ft/s² comfort limit | fleet specification |
| Fleet | 12 cars in two-car consists, 4 cars (2 consists) on the loop, 7:15 apart | fleet specification + timetable |
| Moving block | ≥ 300 ft safe stopping buffer between consists | fleet specification |

Each station leg is modelled as **accelerate → cruise → brake** with a 15 second
dwell at the platform, so the train visibly pulls away from a station and
settles onto the next one instead of teleporting between them.

**One clock, one story.** The map, the "SIMULATED LOOP CADENCE" readout and
the phone countdown pill all read the same fleet clock, which is anchored to
the start of the current service window and only advances while the line is in
service. The vehicle on the map is therefore the vehicle the countdown is
counting down, and the readout says `DUE AT PLATFORM` at the exact moment the
consist is standing on the platform.

### 3. Station Infrastructure & Contextual Drawers
- **People Mover Loop:** Maps all 13 official Detroit People Mover stations in the agency's counter-clockwise order — Times Square, Michigan, Fort/Cass, Huntington Place, Water Square, Financial District, Millender, Renaissance Center, Bricktown, Greektown, Cadillac Center, Broadway, Grand Circus Park. The loop runs in one direction only, so every route, dwell point and countdown follows that order.
- **QLine Corridor:** Features fully integrated station drawers and localized dining spots tailored for the streetcar route. Operating hours, per-stop departure times, run times and the street alignment all come from the official QLINE GTFS feed, with the published hours as the fallback when the feed has no service for the date.
- **Contextual Drawers & Anchor Slots:** Tapping any station pin or list item slides up a glassmorphism bottom drawer displaying live status, walking metrics, verified local dining options with the two-slot anchor architecture (slot 1 annual, slot 2 rotating), nearby park-once garages, and the proximity "Set alarm" notification trigger.

### 3a. Front end structure
`src/routes/index.tsx` is only the route definition. The HUD lives in
`src/components/`, split by responsibility:

| Area | Files |
| --- | --- |
| The HUD shell and its state | `src/components/HomeHud.tsx` |
| Header, presets and the map chrome | `src/components/hud/` — `TopBar`, `QuickRoutesMenu`, `QuickRoutesBar`, `HeadlineArea`, `TickerHud`, `StationDirectoryPanel`, `MapStage`, `MapChrome`, `StationLauncher`, `StatusStrip`, `ComplianceFooter`, `AlarmBanner`, `WakeScreen` |
| Drawers | `src/components/drawers/` — `StationDrawer`, `StationDirectoryDrawer`, `InfoPanel` |
| Dialogs | `src/components/dialogs/` — `QuickNavDialog`, `LegalDialog`, `WalkthroughDialog` |

**Two layouts, not one hidden one.** The phone and the desktop render
different trees from the same state: the phone gets the Quick Routes dropdown,
the bottom dock and the station directory drawer, the desktop gets the preset
pills, the side directory panel and the map chrome. The 25 station buttons of
the desktop panel are never in the phone DOM, so a phone does not download or
hydrate the desktop layout. The breakpoint lives in `src/hooks/use-mobile.tsx`
and matches the `768px` breakpoint of the stylesheet.

### 4. Partner Program & Admin Portal
- **Stripe Checkout:** The partner page embeds the Stripe pricing table and can also start a server priced Checkout Session. Slot 1 is sold on the annual plan only, slot 2 on either plan, and the server decides the price.
- **Anchor Slots:** Slot 1 of Fort / Cass is held by Lafayette Coney Island; every other slot shows a "Claim Slot" call to action.
- **Partner Admin:** `/admin` (linked from the app footer) signs in, lists every merchant intake submission, and approves or rejects leads. Approving a lead writes the anchor slot assignment, which the station drawer picks up immediately.

---

## 🔑 Environment Configuration

To run the Mapbox 3D satellite canvas correctly, configure your environment variables with a secure public token placeholder:

```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

Server side secrets live in `.env.local` (gitignored) or the deployment environment:

```env
STRIPE_SECRET_KEY=your_stripe_restricted_or_secret_key
STRIPE_PRICING_TABLE_ID=prctbl_xxxxxxxxxxxx
STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxx
STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxx
ADMIN_USERNAME=choose-an-admin-user
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_SESSION_SECRET=64_random_hex_characters
```

The partner portal has **no default credentials**. If `ADMIN_USERNAME`,
`ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` is missing, `/admin` and the
`/api/admin/*` routes answer `503` and the portal stays closed. The session
signing key is never derived from the password, so a leaked password cannot be
turned into a forged session cookie.

#### Setting up the portal

The credentials live in the secret store, never in the repository:

1. Put them in the gitignored `.env.local` for local work:

   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=a-strong-password
   ADMIN_SESSION_SECRET=64_random_hex_characters
   ```

   Generate the signing key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

2. Push the same three values to the deployed Worker. The script reads them
   from `.env.local` and pipes them into Wrangler, so they never appear in a
   command line or a build log:

   ```bash
   npm run build          # writes the Worker name the script uses
   npm run secrets:admin  # or: npm run secrets:admin -- --name <worker>
   ```

   It needs a Wrangler login (`npx wrangler login`) or a
   `CLOUDFLARE_API_TOKEN` in the environment.

After that, `/admin` signs in with the configured username and password and
lists every merchant intake lead for approval. Approving a lead writes the
anchor slot assignment, which the station drawer picks up immediately.

Ensure `mapbox-gl/dist/mapbox-gl.css` is properly imported in your project entry file.

### Transit data refresh

```bash
npm run build:transit   # rebuild the People Mover and QLINE schedules from the agency GTFS feeds
```

This regenerates `src/data/dpmSchedule.json`, `src/data/peopleMoverShape.ts`,
`src/data/qlineSchedule.json` and `src/data/qlineShape.ts`. A scheduled GitHub
Actions workflow (`.github/workflows/refresh-transit-data.yml`) runs it daily and
commits the result, so the bundled calendars keep up with the agencies. The
feeds publish finite calendars — the People Mover calendar currently ends
2026-12-31 — so the refresh is what keeps the app from falling back to
"service closed".

---

## 💻 Development & Local Setup

Prefer working locally? You need Node.js and npm — [install with nvm](https://www.google.com/search?q=https://github.com/nvm-sh/nvm%23installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev

```

### Checks that gate a pull request

`.github/workflows/pull-request.yml` runs on every pull request and on every
push to `main`:

| Step | Command | What it catches |
| --- | --- | --- |
| Lint | `npm run lint` | React hook misuse, unsafe imports, `any` types |
| Format | `npx prettier --check .` | formatting drift |
| Type check | `npx tsc --noEmit -p tsconfig.json` | type errors |
| Contrast audit | `npm run audit:contrast` | WCAG AA regressions in the HUD palette |
| Test | `npm test` | the fleet simulation, the layout split, the portal auth |
| Build | `npm run build` | a broken production build |

The build needs no secrets, so the workflow runs on forks. Run the same
commands locally before opening a pull request:

```sh
npm run lint && npx prettier --check . && npx tsc --noEmit && npm run audit:contrast && npm test && npm run build
```

Formatting is enforced with the repository's own Prettier configuration
(single quotes, 100 column). The hand written HUD stylesheet in
`src/styles.css` and the vendored shadcn kit in `src/components/ui` are
excluded from it, so they keep their compact and upstream formatting.

---

## 📄 Compliance & Footer

Fixed bottom compliance footer stamp:

`MOTORCITY AUTOMATED SYSTEMS · Building Targeted Autonomous Civic-Tech Solutions`

The footer links out to the agency site, the rider guide, the Terms & Conditions,
the Privacy Policy, the **Disclaimer** (the non-affiliation notice) and the Partner
Admin portal. The disclaimer paragraph is served by the Disclaimer dialog so the
footer stays a short dock on a phone.

*Project built with [Lovable](https://lovable.dev).*

**Live app:** [https://dpmgo.lovable.app](https://dpmgo.lovable.app)

```

```
