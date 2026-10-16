
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

### 2. 3D Satellite Map Canvas & Telemetry
- **Mapbox Integration:** Initialized using `mapbox://styles/mapbox/satellite-streets-v12`. Centered on downtown Detroit (`[-83.0458, 42.3314]`) with a zoom of `15.5`, a pitch of `50` degrees, and a bearing of `-20` degrees for 3D isometric building extrusions.
- **Vehicle Simulation & Tracking:** Interactive tracking dots that pace smoothly along the single-track loop and QLine corridor with station stops and arrival sync.

### 3. Station Infrastructure & Contextual Drawers
- **People Mover Loop:** Maps all 13 official Detroit People Mover stations in exact sequential order (from Michigan Station to Times Square Station).
- **QLine Corridor:** Features fully integrated station drawers and localized dining spots tailored for the streetcar route.
- **Contextual Drawers & Anchor Slots:** Tapping any station pin or list item slides up a glassmorphism bottom drawer displaying live status, walking metrics, verified local dining options with anchor slots, and the new proximity "Set alarm" notification trigger.

---

## 🛠️ Environment Configuration

To run the Mapbox 3D satellite canvas correctly, configure your environment variables with a secure public token placeholder:

```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here

```

Ensure `mapbox-gl/dist/mapbox-gl.css` is properly imported in your project entry file.

---

## 💻 Development & Local Setup

Prefer working locally? You need Node.js and npm — [install with nvm](https://www.google.com/search?q=https://github.com/nvm-sh/nvm%23installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev

```

---

## 📄 Compliance & Footer

Fixed bottom compliance footer stamp:

`MOTORCITY AUTOMATED SYSTEMS · DPM - Go! Building Targeted Autonomous Solutions for Detroit`

*Project built with [Lovable](https://lovable.dev).*

**Live app:** [https://dpmgo.lovable.app](https://dpmgo.lovable.app)

```

```
