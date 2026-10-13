```markdown
# DPM - Go!

**DPM - Go!** is an advanced, mobile-first downtown transit utility application engineered for **Motorcity Automated Systems**. Designed specifically to remove friction from urban mobility, the app unifies Detroit's core transit arteries—the 2.9-mile elevated Detroit People Mover (DPM) loop and the QLine streetcar corridor—into a singular, zero-friction interface. 

The core mission of DPM - Go! is to encourage visitors, commuters, and residents to "park once" (or ditch personal vehicles entirely) and explore downtown destinations, local dining, and major sports/entertainment events completely on foot.

---

## 📋 Version Evolution & Architecture

### v1.0.0 (Initial Public Release)
The foundational release established the core utility and interface framework:
- **Sci-Fi HUD Canvas:** Custom dark-mode interface (`#070B14`), 3D isometric building extrusions (such as the Renaissance Center), and glowing neon-cyan transit loops (`#00F0FF`) on a Mapbox satellite-streets canvas.
- **Zero-Login Friction:** Instantaneous mobile launch without requiring user accounts, password walls, or onboarding friction—essential for outdoor platform use.
- **The 13 People Mover Stations:** Sequentially mapped station directory (from Michigan Station to Times Square Station) paired with contextual glassmorphism bottom drawers displaying hours, active status, and verified local dining options with price tiers (`$–$$$$`).
- **Activity & Sports Feeds:** Initial support for surfacing upcoming Detroit sports schedules (Lions, Tigers, Red Wings, Pistons) and downtown-exclusive public events.

### v2.0.0 (The Live Data-Driven Evolution)
The current version evolves the app into a proactive, real-time municipal utility:
- **Homepage Live Countdown Ticker:** A live, ticking arrival countdown and service status indicator directly on the main HUD header next to the system overview line, computed via real-time station scheduling logic (`Next train in ~X min` or `SERVICE CLOSED`).
- **Geo-Fenced "Alert Me at My Stop" Haptics:** Proactive arrival alerts and vibration triggers that notify riders 60 seconds / 200 meters before reaching their selected destination, solving real-world transit issues like muffled audio and tinted windows.
- **Door-to-Station Entrance & Skywalk Guides:** Clear visual walking directions for complex or tucked-away downtown hubs (e.g., Millender Center skywalk, Huntington Place concourse level).
- **Live Transit & Event Integrations:** Direct hooks into schedule telemetry and dynamic congestion alerts for major downtown demand drivers.

---

## 🚀 Core Features & Architectural Pillars

1. **UI & Visual Architecture:** High-contrast urban transport HUD with pill-style live toggle switches for "PEOPLE MOVER" and "QLINE".
2. **3D Satellite Map Canvas & Telemetry:** Initialized using `mapbox://styles/mapbox/satellite-streets-v12` centered on downtown Detroit (`[-83.0458, 42.3314]`) at zoom `15.5`, pitch `50°`, and bearing `-20°`.
3. **Contextual Station Drawers & Dining Directory:** Verified independent restaurants within walking distance featuring precise metrics, thumbnails, and direct links.
4. **Footer Compliance Stamp:**  
   `MOTORCITY AUTOMATED SYSTEMS · DPM - Go! Building Targeted Autonomous Solutions for Detroit`

---

## 🛠 Environment Configuration

To run the Mapbox 3D satellite canvas correctly, configure your environment variables:

```env
VITE_MAPBOX_TOKEN=pk.eyJ1Ijoic2VwaDA3IiwiYSI6ImNtdXJlemRzdDBsbGIyem9lM3FiMjNybTgifQ.L5t2LjoKXMStl9gL-837Nw

```

Ensure `mapbox-gl/dist/mapbox-gl.css` is properly imported in your project entry file.

---

## 💻 Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://www.google.com/search?q=https://github.com/nvm-sh/nvm%23installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev

```

*Project built with [Lovable](https://lovable.dev).*

**Live app:** [https://dpmgo.lovable.app](https://dpmgo.lovable.app)

```

```
