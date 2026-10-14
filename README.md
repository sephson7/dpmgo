
# DPM - Go!

**DPM - Go!** is an advanced, mobile-first downtown transit utility application engineered for **Motorcity Automated Systems** . Designed specifically to remove friction from urban mobility, the app unifies Detroit's core transit arteries—the 2.9-mile elevated Detroit People Mover (DPM) loop and the QLine streetcar corridor—into a singular, zero-friction interface . 

The core mission of DPM - Go! is to encourage visitors, commuters, and residents to "park once" (or ditch personal vehicles entirely) and explore downtown destinations, local dining, and major sports/entertainment events completely on foot .

---

## 🏗️ Version Evolution

### Version 1.0.0 (Initial Public Release)
* **Sci-Fi HUD Canvas:** Custom dark-mode interface (`#070B14`), 3D isometric building extrusions (such as the Renaissance Center), and glowing neon-cyan transit loops (`#00F0FF`) .
* **Zero-Login Friction:** Instantaneous mobile launch without requiring user accounts, password walls, or onboarding friction—essential for outdoor platform use .
* **Verified Local Dining Directory:** Contextual slide-up station drawers mapping verified high-rating local restaurants within a 0.5 to 1-mile walking radius complete with price tiers ($–$$$$) .
* **Station Infrastructure:** Mapped all 13 official Detroit People Mover stations in sequential order with built-in regional transfer placeholders .

### Version 2.0.0 (Live Data-Driven Evolution)
* **Live Arrival Countdown Clocks:** Direct GTFS-Realtime data integration for exact vehicle tracking and accurate countdown timers   .
* **Dynamic City Event & Sports Integrations:** Live API schedule connections for venue hubs like Ford Field, Comerica Park, Little Caesars Arena, and Hart Plaza to automatically highlight surrounding station congestion  .
* **ADA Accessibility & Station Status Alerts:** Real-time platform accessibility tracking, including elevator and escalator operational status badges across all 13 stops  .
* **"Park Once" Impact & Carbon Calculator:** An urban mobility widget tracking money saved on parking fees alongside foot-traffic step count and carbon footprint reduction   .

---

## 🚀 Core Architectural Pillars

### 1. UI & Visual Architecture
* **Theme & Aesthetic:** High-contrast urban transport HUD with deep charcoal/navy backgrounds (`#070B14`), glowing neon-cyan transit lines (`#00F0FF`), and frosted glassmorphism containers (`backdrop-blur-xl bg-slate-900/80 border border-cyan-500/30`) .
* **Header & Navigation:** Pill-style live toggle switches for **"PEOPLE MOVER"** and **"QLINE"**, alongside a top dropdown menu for activity calendars, sports schedules, and event feeds .

### 2. 3D Satellite Map Canvas & Telemetry
* **Mapbox Integration:** Initialized using `mapbox://styles/mapbox/satellite-streets-v12`. Centered on downtown Detroit (`[-83.0458, 42.3314]`) with a zoom of `15.5`, a pitch of `50` degrees, and a bearing of `-20` degrees for 3D isometric building extrusions .
* **Vehicle Simulation & Tracking:** Amber tracking dots that pace smoothly along the single-track loop and QLine corridor with station stops and real-time arrival sync[cite: 2, 5].

### 3. The 13 People Mover Stations & Contextual Drawers
The app maps all 13 official Detroit People Mover stations in exact sequential order[cite: 2, 5]:
1. Michigan Station 
2. Fort / Cass Station 
3. Huntington Place Station 
4. Water Square Station 
5. Financial District Station 
6. Millender Center Station 
7. Renaissance Center Station 
8. Bricktown Station 
9. Greektown Station 
10. Cadillac Center Station 
11. Broadway Station 
12. Grand Circus Park Station 
13. Times Square Station 

* **Contextual Drawers:** Tapping any station pin or list item slides up a glassmorphism bottom drawer displaying live status, walking metrics, and a curated list of verified local dining options .

---

## 🛠️ Environment Configuration

To run the Mapbox 3D satellite canvas correctly, configure your environment variables :

```env
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoic2VwaDA3IiwiYSI6ImNtdXJlemRzdDBsbGIyem9lM3FiMjNybTgifQ.L5t2LjoKXMStl9gL-837Nw

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
