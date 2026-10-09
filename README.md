# DPM - Go!

**DPM - Go!** is an advanced, mobile-first downtown transit utility application engineered by **Motorcity Automated Systems**. Designed specifically to remove friction from urban mobility, the app unifies Detroit's core transit arteries—the 2.9-mile elevated Detroit People Mover (DPM) loop and the QLine streetcar corridor—into a singular, zero-friction interface.

The core mission of DPM - Go! is to encourage tourists, commuters, and residents to "park once" (or ditch personal vehicles entirely) and explore downtown destinations, local dining, and major sports/entertainment events completely on foot.

---

## Core Features & Architectural Pillars

### 1. UI & Visual Architecture

* **Sci-Fi HUD Canvas:** Replaces generic map templates with a custom dark-mode interface (`#070B14`), 3D isometric building extrusions (such as the Renaissance Center), and glowing neon-cyan transit loops (`#00F0FF`).
* **Zero-Login Friction:** Instantaneous mobile launch without requiring user accounts, password walls, or onboarding friction—essential for outdoor platform use.
* **Header & Navigation:** Features brand identity with pill-style live toggle switches for **"PEOPLE MOVER"** and **"QLINE"**, alongside a top dropdown menu for viewing activity calendars, sports schedules, and event feeds.

### 2. 3D Satellite Map Canvas & Telemetry

* **Mapbox Integration:** Initialized using `mapbox://styles/mapbox/satellite-streets-v12`. Centered on downtown Detroit (`[-83.0458, 42.3314]`) with a zoom of `15.5`, a pitch of `50` degrees, and a bearing of `-20` degrees for an immersive 3D isometric view.
* **Live Telemetry & Vehicle Simulation:** Integrates real-time data feeds to power live vehicle tracking dots and arrival countdowns, pacing smoothly along the single-track loop and QLine corridor.

### 3. The 13 People Mover Stations & Contextual Drawers

The app maps all 13 official Detroit People Mover stations in exact sequential order:

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

* **Contextual Station Drawers:** Tapping any station pin or scrollable list item slides up a glassmorphism bottom drawer displaying hours of operation, active status alerts, walking metrics, and verified local dining options complete with price tiers (`$–$$$$`) and direct external links.

### 4. Interactive Filters & Future Scalability

* **Sports & Activity Feeds:** Surfaces upcoming home games for Detroit teams (Lions, Tigers, Red Wings, Pistons) and downtown-exclusive public event schedules.
* **Regional Scalability:** Built with architectural placeholders to incorporate future regional commuter links, such as the D2A2 (Detroit-to-Ann Arbor) express.

### 5. Footer Compliance Stamp

Fixed bottom compliance footer:

`MOTORCITY AUTOMATED SYSTEMS · DPM - Go! Building Targeted Autonomous Solutions for Detroit`

---

## Environment Configuration

To run the Mapbox 3D satellite canvas correctly, configure your environment variables:

```env
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoic2VwaDA3IiwiYSI6ImNtdXJlemRzdDBsbGIyem9lM3FiMjNybTgifQ.L5t2LjoKXMStl9gL-837Nw

```

Ensure `mapbox-gl/dist/mapbox-gl.css` is properly imported in your project entry file.

---

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev

```

---

*Project built with [Lovable](https://lovable.dev).*

**Live app**: [https://dpmgo.lovable.app](https://dpmgo.lovable.app)
