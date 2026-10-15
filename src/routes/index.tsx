import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useMemo, type ComponentType } from 'react';
import {
  Accessibility,
  AlertCircle,
  ArrowRight,
  Bell,
  BellOff,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Layers3,
  LocateFixed,
  MapPin,
  Navigation2,
  Radio,
  Route as RouteIcon,
  Search,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  peopleMoverStations,
  qlineStations,
  allTransitStations,
  nearbyRestaurants,
  sportsTeams,
  activities,
  milesBetween,
  type Station,
} from '@/data/transit';
import { getNextTrainForStation } from '@/data/trainSimulation';
import { stationSchedule } from '@/data/schedule';
import { useStationAlert } from '@/hooks/useStationAlert';
import logo from '@/assets/dpm-go-logo.jpg.asset.json';

const diningImages = import.meta.glob<{ url: string }>('/src/assets/dining/*.asset.json', { eager: true, import: 'default' });
const diningImage = (id: string) => diningImages[`/src/assets/dining/${id}.jpg.asset.json`]?.url;

type MapProps = {
  peopleMover: boolean;
  qline: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReady?: (ready: boolean) => void;
  restaurantId?: string | null;
  isBoarded?: boolean;
  userPosition?: [number, number] | null;
};

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'DPM - Go! | Detroit Transit Map' },
      { name: 'description', content: 'Explore Detroit People Mover stations and the QLINE corridor on an interactive downtown map.' },
      { property: 'og:title', content: 'DPM - Go! | Detroit Transit Map' },
      { property: 'og:description', content: 'Explore Detroit People Mover stations and the QLINE corridor on an interactive downtown map.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: Index,
});

function Index() {
  const [MapComponent, setMapComponent] = useState<ComponentType<MapProps> | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [peopleMover, setPeopleMover] = useState(true);
  const [qline, setQline] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stationListOpen, setStationListOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isBoarded, setIsBoarded] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  // GPS watcher when rider is boarded
  useEffect(() => {
    if (!isBoarded || typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => setUserPos([pos.coords.longitude, pos.coords.latitude]),
      err => console.warn('Boarded GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isBoarded]);

  const toggleRestaurant = (id: string) => {
    setRestaurantId(prev => (prev === id ? null : id));
  };

  const [panel, setPanel] = useState<null | 'activities' | string>(null);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [waking, setWaking] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const alertSystem = useStationAlert();

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(ticker);
  }, []);

  // Filter stations based on the active homepage route buttons
  const activeStations = useMemo(() => {
    if (peopleMover && !qline) return peopleMoverStations;
    if (!peopleMover && qline) return qlineStations;
    return allTransitStations;
  }, [peopleMover, qline]);

  const selected = allTransitStations.find(station => station.id === selectedId) ?? null;
  const filtered = activeStations.filter(station => station.name.toLowerCase().includes(search.toLowerCase()));

  // Active station for hero countdown ticker
  const nearestStation = useMemo(() => {
    if (!userPos) return activeStations[0] as Station;
    const sorted = [...activeStations].sort((a, b) => milesBetween(userPos, a.coordinate) - milesBetween(userPos, b.coordinate));
    return (sorted[0] as Station) ?? (activeStations[0] as Station);
  }, [userPos, activeStations]);

  const tickerStation = selected ?? nearestStation;
  const isQLineTicker = tickerStation.line === 'qline';
  const tickerSchedule = useMemo(() => stationSchedule(tickerStation.id, now), [tickerStation.id, now]);
  const nextDeparture = tickerSchedule.trains[0] ?? null;

  const [liveArrival, setLiveArrival] = useState(() => getNextTrainForStation(tickerStation.id));
  useEffect(() => {
    setLiveArrival(getNextTrainForStation(tickerStation.id));
    const liveTimer = window.setInterval(() => {
      setLiveArrival(getNextTrainForStation(tickerStation.id));
    }, 2000);
    return () => window.clearInterval(liveTimer);
  }, [tickerStation.id]);

  useEffect(() => {
    import('@/components/TransitMap').then(module => setMapComponent(() => module.default));
  }, []);

  useEffect(() => {
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1450;
    const timer = window.setTimeout(() => setWaking(false), delay);
    return () => window.clearTimeout(timer);
  }, []);

  const openStation = (id: string) => {
    setRestaurantId(null);
    if (stationListOpen) {
      setStationListOpen(false);
      window.setTimeout(() => setSelectedId(id), 320);
    } else {
      setSelectedId(id);
    }
  };

  return (
    <main className="app-shell">
      <div className="map-plane" aria-hidden={!MapComponent}>
        <div className="map-placeholder" aria-hidden="true">
          <div className="map-placeholder-grid" />
        </div>
        {MapComponent && (
          <MapComponent
            peopleMover={peopleMover}
            qline={qline}
            selectedId={selectedId}
            onSelect={openStation}
            onReady={setMapReady}
            restaurantId={restaurantId}
            isBoarded={isBoarded}
            userPosition={userPos}
          />
        )}
        <div className="map-vignette" />
      </div>

      <div className="interface-shell">
        <header className="topbar">
          <div className="brand-block">
            <img src={logo.url} alt="DPM - Go! logo" className="brand-logo" />
            <div>
              <div className="brand-name">
                DPM <span>–</span> Go<span className="brand-bang">!</span>
              </div>
              <div className="brand-caption">MOTORCITY AUTOMATED SYSTEMS</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="city-tag">
              <span className="signal-dot" /> DETROIT, MI <span className="tag-divider">/</span> TRANSIT NETWORK
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="hudOutline" size="hud" aria-label="Open Detroit events and sports links">
                  <span className="desktop-label">EXPLORE DETROIT</span>
                  <span className="mobile-label">EVENTS</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-menu">
                <DropdownMenuLabel>LOCAL DESTINATIONS</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setPanel('activities')}>
                  <span>Downtown Activities</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>DETROIT SPORTS</DropdownMenuLabel>
                {sportsTeams.map(item => (
                  <DropdownMenuItem key={item.id} onClick={() => setPanel(item.id)}>
                    <span>{item.team}</span>
                    <small className="menu-sub">{item.league}</small>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="hudOutline" size="hud" className="station-list-btn" onClick={() => setStationListOpen(true)}>
              <Layers3 size={14} />
              <span>STATIONS</span>
            </Button>
          </div>
        </header>

        {alertSystem.targetStation && (
          <div className={`active-alarm-banner ${alertSystem.hasAlerted ? 'alarm-triggered' : ''}`}>
            <Bell size={14} className="animate-bounce" />
            <span>
              {alertSystem.hasAlerted
                ? `ARRIVING AT ${alertSystem.targetStation.name.toUpperCase()}!`
                : `STOP ALARM: ${alertSystem.targetStation.name} (~${alertSystem.distanceMiles?.toFixed(2) ?? '...'} mi)`}
            </span>
            <button type="button" onClick={alertSystem.cancelAlert} className="alarm-cancel-btn" title="Cancel alert">
              <BellOff size={13} />
            </button>
          </div>
        )}

        <section className="headline-area" aria-label="Transit overview">
          <div className="overline">
            <span className="overline-bar" /> DOWNTOWN DETROIT <span className="overline-slash">/</span> SYSTEM OVERVIEW
          </div>
          <h1>
            Move through
            <br />
            <em>the Motor City.</em>
          </h1>
          <p>Two lines. One city. Find your next stop.</p>

          <div className="mobile-countdown-pill" role="status" aria-live="polite">
            <span className={`signal-dot ${isQLineTicker || tickerSchedule.running ? 'signal-pulse' : 'signal-idle'}`} />
            <span className="mobile-countdown-label">
              {isBoarded ? 'NEXT STOP' : 'NEXT ARRIVAL'} · {tickerStation.name.toUpperCase()}:
            </span>
            <strong className="mobile-countdown-val">
              {isQLineTicker ? 'EVERY 10-15 MIN' : tickerSchedule.running ? liveArrival.formatted : 'OFFLINE'}
            </strong>
          </div>

          <div className="boarded-action-wrap">
            <Button
              type="button"
              variant={isBoarded ? 'default' : 'outline'}
              size="sm"
              className={`boarded-mode-btn ${isBoarded ? 'is-boarded' : ''}`}
              onClick={() => setIsBoarded(v => !v)}
            >
              <Navigation2 size={13} className={isBoarded ? 'animate-pulse text-emerald-400' : ''} />
              <span>{isBoarded ? 'ON BOARD · FOLLOWING RIDE' : 'BOARDED THE TRAIN?'}</span>
            </Button>
          </div>

          {/* Toggle buttons between People Mover and QLINE */}
          <div className="route-switches" role="group" aria-label="Map layers">
            <Button
              variant={peopleMover ? 'hudActive' : 'hudInactive'}
              size="route"
              aria-pressed={peopleMover}
              onClick={() => {
                // Ensure at least one route is visible
                if (peopleMover && !qline) {
                  setQline(true);
                  setPeopleMover(false);
                } else {
                  setPeopleMover(v => !v);
                }
              }}
            >
              <span className="route-pill-dot" /> PEOPLE MOVER <span className="route-pill-state">{peopleMover ? 'ON' : 'OFF'}</span>
            </Button>
            <Button
              variant={qline ? 'hudWarm' : 'hudInactive'}
              size="route"
              aria-pressed={qline}
              onClick={() => {
                // Ensure at least one route is visible
                if (qline && !peopleMover) {
                  setPeopleMover(true);
                  setQline(false);
                } else {
                  setQline(v => !v);
                }
              }}
            >
              <span className="route-pill-dot" /> QLINE <span className="route-pill-state">{qline ? 'ON' : 'OFF'}</span>
            </Button>
          </div>
        </section>

        {/* Directory Sidebar adapted to active network toggles */}
        <aside className="network-panel" aria-label="Transit stations">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">
                <span className="signal-dot" />{' '}
                {!peopleMover && qline ? 'NETWORK 02 · QLINE' : peopleMover && !qline ? 'NETWORK 01 · DPM' : 'TRANSIT DIRECTORY'}
              </div>
              <h2>{!peopleMover && qline ? 'QLINE Streetcar' : peopleMover && !qline ? 'People Mover' : 'Detroit Transit'}</h2>
              <p>
                {!peopleMover && qline
                  ? 'Woodward Corridor · 12 stations · 3.3 miles'
                  : peopleMover && !qline
                    ? 'Downtown loop · 13 stations · 2.9 miles'
                    : 'People Mover & QLINE · 25 stations'}
              </p>

              <div className="homepage-ticker-hud" role="status" aria-live="polite">
                <div className="ticker-hud-header">
                  <span className="ticker-hud-kicker">
                    <Timer size={11} className={isQLineTicker || tickerSchedule.running ? 'text-primary' : 'text-muted-foreground'} />
                    {isQLineTicker ? 'STREETCAR FREQUENCY' : 'NEXT SCHEDULED TRAIN'}
                  </span>
                  <span className="ticker-hud-target">{tickerStation.name}</span>
                </div>
                <div className="ticker-hud-display">
                  <span className={`ticker-hud-indicator ${isQLineTicker || tickerSchedule.running ? 'is-live' : 'is-off'}`} />
                  <span className="ticker-hud-countdown">
                    {isQLineTicker ? (
                      <>
                        HEADWAY: <strong>10–15</strong> MIN <small>(Mon-Sat 8A-10P)</small>
                      </>
                    ) : tickerSchedule.running ? (
                      nextDeparture ? (
                        nextDeparture.minutes <= 0 ? (
                          <strong className="ticker-due-now">DUE AT PLATFORM</strong>
                        ) : (
                          <>
                            IN <strong>{nextDeparture.minutes}</strong> MIN <small>({nextDeparture.time})</small>
                          </>
                        )
                      ) : (
                        <span>LOOKING UP NEXT RUN...</span>
                      )
                    ) : (
                      <span className="ticker-off-hours">SERVICE SUSPENDED (OFF-HOURS)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <RouteIcon size={20} className="panel-route-icon" />
          </div>

          <div className="panel-rule" />
          <div className="panel-section-title">
            <span>STATION DIRECTORY</span>
            <span>01 — {String(activeStations.length).padStart(2, '0')}</span>
          </div>
          <label className="station-search">
            <Search size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a station..." aria-label="Find a station" />
            <kbd>⌕</kbd>
          </label>
          <div className="station-scroll">
            {filtered.length ? (
              filtered.map(station => (
                <Button
                  key={station.id}
                  variant="station"
                  size="station"
                  onClick={() => openStation(station.id)}
                  className={selectedId === station.id ? 'station-selected' : ''}
                >
                  <span className="station-number">
                    {station.line === 'qline' ? 'QL' : 'DPM'}
                    {String(activeStations.indexOf(station) + 1).padStart(2, '0')}
                  </span>
                  <span className="station-track">
                    <span className="station-node" />
                  </span>
                  <span className="station-name">{station.name}</span>
                  <ArrowRight size={14} className="station-arrow" />
                </Button>
              ))
            ) : (
              <div className="empty-search">No stations found.</div>
            )}
          </div>
          <div className="panel-bottom">
            <span>
              <span className="tiny-diamond" /> INTERACTIVE PLATFORMS
            </span>
            <span>SIMULATED VEHICLES</span>
          </div>
        </aside>

        <div className="map-overlay-info">
          <span className="map-crosshair">⊕</span>
          <div>
            <strong>DOWNTOWN DETROIT</strong>
            <small>42.3314° N &nbsp; 83.0458° W</small>
          </div>
        </div>
        <div className="map-controls">
          <Button
            variant="mapControl"
            size="icon"
            title="Reset map view"
            aria-label="Reset map view"
            onClick={() => window.dispatchEvent(new CustomEvent('dpm-map-reset'))}
          >
            <LocateFixed size={18} />
          </Button>
        </div>
        <div className="map-legend">
          <span>
            <i className="legend-line cyan-line" /> PEOPLE MOVER
          </span>
          <span>
            <i className="legend-line warm-line" /> QLINE
          </span>
          <span>
            <i className="legend-vehicle" /> SIMULATED VEHICLE
          </span>
        </div>
        <div className="status-strip">
          <div>
            <Radio size={14} />
            <strong>NETWORK VISUALIZATION</strong>
            <span className="status-divider">/</span>
            <span>{mapReady ? 'MAP ONLINE' : 'LOADING MAP'}</span>
          </div>
          <span>VEHICLE POSITIONS ARE SIMULATED · NOT LIVE ARRIVALS</span>
        </div>

        <footer className="compliance-footer">
          <div>
            <span>MOTORCITY AUTOMATED SYSTEMS · DPM - Go!</span>
            <span className="footer-sub">Building Targeted Autonomous Solutions for Detroit</span>
          </div>
          <div className="footer-links">
            <a href="https://www.thepeoplemover.com" target="_blank" rel="noopener noreferrer" className="footer-external">
              thepeoplemover.com <ExternalLink size={12} />
            </a>
            <span className="footer-divider">·</span>
            <button type="button" onClick={() => setLegal('terms')} className="legal-btn">
              Terms &amp; Conditions
            </button>
            <span className="footer-divider">·</span>
            <button type="button" onClick={() => setLegal('privacy')} className="legal-btn">
              Privacy Policy
            </button>
          </div>
        </footer>
      </div>

      {/* Station Drawer with Dining & Anchor Partner Logic */}
      <Drawer open={Boolean(selected)} onOpenChange={open => !open && setSelectedId(null)}>
        <DrawerContent className="drawer-shell">
          {selected && (
            <StationDetails
              station={selected}
              restaurantId={restaurantId}
              onRestaurant={toggleRestaurant}
              isArmed={alertSystem.targetStation?.id === selected.id}
              onArm={() => alertSystem.armAlert(selected)}
              onDisarm={alertSystem.cancelAlert}
            />
          )}
        </DrawerContent>
      </Drawer>

      <Drawer open={stationListOpen} onOpenChange={setStationListOpen}>
        <DrawerContent className="drawer-shell">
          <DrawerHeader>
            <div className="drawer-eyebrow">DETROIT TRANSIT</div>
            <DrawerTitle>Station Directory</DrawerTitle>
            <DrawerDescription>Select any station across the People Mover and QLINE corridors.</DrawerDescription>
          </DrawerHeader>
          <div className="station-drawer-list">
            {activeStations.map(station => (
              <Button key={station.id} variant="station" size="station" onClick={() => openStation(station.id)}>
                <span className="station-number">{String(activeStations.indexOf(station) + 1).padStart(2, '0')}</span>
                <span className="station-track">
                  <span className="station-node" />
                </span>
                <span className="station-name">
                  {station.name} <small className="text-muted-foreground ml-1">({station.line === 'qline' ? 'QLINE' : 'DPM'})</small>
                </span>
                <ArrowRight size={14} className="station-arrow" />
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(panel)} onOpenChange={open => !open && setPanel(null)}>
        <DrawerContent className="drawer-shell">
          <InfoPanel panel={panel} />
        </DrawerContent>
      </Drawer>

      <Dialog open={Boolean(legal)} onOpenChange={open => !open && setLegal(null)}>
        <DialogContent className="legal-dialog">
          <DialogHeader>
            <DialogTitle>{legal === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}</DialogTitle>
            <DialogDescription>
              Software developed by Detroit Core Automation, LLC, a subsidiary of Motorcity Automated Systems, LLC.
            </DialogDescription>
          </DialogHeader>
          <div className="legal-body">
            {legal === 'terms' ? (
              <>
                <p>
                  <strong>Disclaimer of Transit Data &amp; Timetables:</strong> DPM - Go! is an independent utility created to assist
                  Detroit transit riders. All schedules, next-train countdowns, and moving vehicle markers represent published GTFS
                  timetables and visual simulations. Motorcity Automated Systems, LLC and Detroit Core Automation, LLC make no guarantee of
                  real-time accuracy and expressly disclaim all liability for transit delays, service interruptions, or missed connections.
                </p>
                <p>
                  <strong>Third-Party Venues:</strong> Restaurant walking metrics, menus, and external links are provided for convenience.
                  Motorcity Automated Systems, LLC does not operate or endorse third-party establishments.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Privacy Policy:</strong> DPM - Go! does not store your location data or sell personal information to third parties.
                  Location permissions are utilized on-device solely to calculate walking distances and trigger arrival alerts.
                </p>
                <p>All map telemetry is loaded client-side via Mapbox GL.</p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {waking && (
        <div className="wake-screen" aria-hidden="true">
          <div className="wake-content">
            <img src={logo.url} alt="DPM - Go! logo" className="wake-logo" />
            <div className="wake-title">DPM - Go!</div>
            <div className="wake-sub">INITIALIZING DETROIT TRANSIT HUD...</div>
          </div>
        </div>
      )}
    </main>
  );
}

function InfoPanel({ panel }: { panel: string | null }) {
  if (panel === 'activities') {
    return (
      <>
        <DrawerHeader>
          <div className="drawer-eyebrow">DOWNTOWN CALENDAR</div>
          <DrawerTitle>Public Activities</DrawerTitle>
          <DrawerDescription>Downtown Detroit and Woodward corridor events.</DrawerDescription>
        </DrawerHeader>
        <div className="info-list">
          {activities.map((a, i) => (
            <a key={i} href={a.href} target="_blank" rel="noopener noreferrer" className="restaurant-item">
              <span className="restaurant-main">
                <strong>{a.name}</strong>
                <small>
                  {a.area} · nearest stop: {a.station}
                </small>
                <p className="activity-note">{a.note}</p>
              </span>
              <ExternalLink size={15} className="restaurant-arrow" />
            </a>
          ))}
        </div>
      </>
    );
  }

  const t = sportsTeams.find(x => x.id === panel);
  if (!t) return null;

  return (
    <>
      <DrawerHeader>
        <div className="drawer-eyebrow">{t.league} / DETROIT SPORTS</div>
        <DrawerTitle>{t.team}</DrawerTitle>
        <DrawerDescription>
          {t.venue} · ride to {t.station}
        </DrawerDescription>
      </DrawerHeader>
      <div className="info-list">
        <div className="detail-stats">
          <div>
            <span>NEXT / RECENT GAME</span>
            <strong className="arrival-unavailable">Live data coming soon</strong>
          </div>
          <div>
            <span>VENUE</span>
            <strong className="next-stop">{t.venue}</strong>
          </div>
          <div>
            <span>NEAREST STOP</span>
            <strong className="next-stop">{t.station}</strong>
          </div>
        </div>
        <Button variant="hudActive" asChild className="info-button">
          <a href={t.href} target="_blank" rel="noopener noreferrer">
            OFFICIAL SCHEDULE <ExternalLink size={13} />
          </a>
        </Button>
      </div>
    </>
  );
}

function StationDetails({
  station,
  restaurantId,
  onRestaurant,
  isArmed,
  onArm,
  onDisarm,
}: {
  station: Station;
  restaurantId: string | null;
  onRestaurant: (id: string) => void;
  isArmed: boolean;
  onArm: () => void;
  onDisarm: () => void;
}) {
  const [priceFilter, setPriceFilter] = useState<'all' | '$' | '$$' | '$$$+'>('all');
  const [maxMinutes, setMaxMinutes] = useState<number | 'all'>('all');
  const [lateNightOnly, setLateNightOnly] = useState(false);

  const isQLine = station.line === 'qline';

  const allNearby = useMemo(() => {
    return nearbyRestaurants(station).map(r => ({
      ...r,
      walkMinutes: Math.max(1, Math.round(r.walkMiles * 20)),
    }));
  }, [station]);

  // Primary Anchor Sponsor: strictly matches if contracted for THIS station
  const primarySponsor = useMemo(() => {
    return allNearby.find(r => r.sponsored && r.sponsorStationId === station.id) ?? null;
  }, [allNearby, station.id]);

  // Filtered standard listings
  const standardSpots = useMemo(() => {
    return allNearby
      .filter(r => r.id !== primarySponsor?.id)
      .filter(r => {
        if (priceFilter === '$' && r.price !== '$') return false;
        if (priceFilter === '$$' && r.price !== '$$') return false;
        if (priceFilter === '$$$+' && r.price !== '$$$' && r.price !== '$$$$') return false;
        if (maxMinutes !== 'all' && r.walkMinutes > maxMinutes) return false;
        if (lateNightOnly && !r.lateNight) return false;
        return true;
      });
  }, [allNearby, primarySponsor?.id, priceFilter, maxMinutes, lateNightOnly]);

  const stationsInLine = isQLine ? qlineStations : peopleMoverStations;
  const number = stationsInLine.findIndex(s => s.id === station.id) + 1;
  const next = stationsInLine[number % stationsInLine.length] ?? station;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${station.entrance[1]},${station.entrance[0]}`;

  const radians = Math.PI / 180;
  const latDifference = (station.entrance[1] - 42.3316) * radians;
  const lonDifference = (station.entrance[0] + 83.0466) * radians;
  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(42.3316 * radians) * Math.cos(station.entrance[1] * radians) * Math.sin(lonDifference / 2) ** 2;
  const walkingMiles = 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
  const walkingMinutes = Math.max(1, Math.round(walkingMiles * 20));

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const sched = stationSchedule(station.id, now);

  return (
    <div className="detail-content">
      <DrawerHeader className="detail-heading">
        <div className="drawer-eyebrow">
          <span className="signal-dot" /> {isQLine ? 'QLINE STREETCAR' : 'PEOPLE MOVER'}{' '}
          <span className="detail-divider">/</span> STATION {String(number).padStart(2, '0')}
        </div>
        <div className="station-title-row">
          <DrawerTitle>{station.name}</DrawerTitle>
          <button
            type="button"
            className={`alarm-toggle-btn ${isArmed ? 'alarm-active' : ''}`}
            onClick={isArmed ? onDisarm : onArm}
            title={isArmed ? 'Cancel stop alert' : 'Alert me when arriving'}
          >
            {isArmed ? <BellOff size={14} /> : <Bell size={14} />}
            <span>{isArmed ? 'ALARM ON' : 'SET ALARM'}</span>
          </button>
        </div>
        <DrawerDescription>
          {station.neighborhood}, Detroit · {station.crossStreets}
        </DrawerDescription>
      </DrawerHeader>

      <div className="detail-stats">
        <div>
          <span>WALK FROM CAMPUS MARTIUS*</span>
          <strong>
            {walkingMinutes} <small>min · ~{walkingMiles.toFixed(1)} mi</small>
          </strong>
        </div>
        <div>
          <span>NEXT STOP</span>
          <strong className="next-stop">{next.name}</strong>
        </div>
        <div>
          <span>SERVICE NOW</span>
          {isQLine ? (
            <strong className="status-open">ACTIVE (8A–10P)</strong>
          ) : (
            <strong className={sched.running ? 'status-open' : 'status-closed'}>{sched.running ? 'OPEN' : 'CLOSED'}</strong>
          )}
        </div>
      </div>

      <div className="entrance-hud-card">
        <div className="entrance-hud-header">
          <div className="entrance-hud-title">
            <Accessibility size={14} className="text-primary" />
            <span>PLATFORM &amp; ENTRANCE GUIDANCE</span>
          </div>
          <div className="entrance-badges">
            <span className={`hud-pill ${station.adaCompliant ? 'pill-green' : 'pill-amber'}`}>
              {station.adaCompliant ? 'ADA COMPLIANT' : 'LIMITED ACCESS'}
            </span>
            <span className={`hud-pill ${station.elevator ? 'pill-cyan' : 'pill-muted'}`}>
              {station.elevator ? 'ELEVATOR VERIFIED' : 'STAIRS / RAMP'}
            </span>
          </div>
        </div>
        <p className="entrance-notes-text">{station.entranceNotes}</p>
      </div>

      <div className="departures-card">
        <div className="departures-header">
          <div className="departures-title">
            <Clock3 size={15} />
            <span>{isQLine ? 'STREETCAR FREQUENCY' : 'SCHEDULED TRAINS'}</span>
          </div>
          <span className="departures-subtitle">
            {isQLine ? 'EVERY 10-15 MIN' : sched.specialToday ? 'SPECIAL EVENT SERVICE' : 'REGULAR TIMETABLE'}
          </span>
        </div>

        {isQLine ? (
          <div className="departures-grid">
            <div className="departure-slot is-imminent">
              <span className="dep-time">NEXT RUN</span>
              <strong className="dep-mins">~5-10 MIN</strong>
              <small className="dep-day">HEADWAY</small>
            </div>
            <div className="departure-slot">
              <span className="dep-time">HOURS</span>
              <strong className="dep-mins">8A–10P</strong>
              <small className="dep-day">MON–SAT</small>
            </div>
            <div className="departure-slot">
              <span className="dep-time">SUNDAYS</span>
              <strong className="dep-mins">8A–8P</strong>
              <small className="dep-day">REGULAR</small>
            </div>
            <div className="departure-slot">
              <span className="dep-time">FARE</span>
              <strong className="dep-mins">FREE</strong>
              <small className="dep-day">CORRIDOR</small>
            </div>
          </div>
        ) : sched.trains.length ? (
          <div className="departures-grid">
            {sched.trains.map((train, i) => (
              <div key={i} className={`departure-slot ${train.minutes <= 4 ? 'is-imminent' : ''}`}>
                <span className="dep-time">{train.time}</span>
                <strong className="dep-mins">
                  {train.minutes <= 0 ? 'DUE' : `in ${train.minutes}m`}
                </strong>
                {train.day && <small className="dep-day">{train.day}</small>}
              </div>
            ))}
          </div>
        ) : (
          <div className="departures-empty">No departures scheduled for this station right now.</div>
        )}
      </div>

      <div className="restaurant-section">
        <div className="section-title">
          <span>NEARBY RESTAURANTS</span>
          <span className="dining-count-badge">
            {allNearby.length} {allNearby.length === 1 ? 'SPOT' : 'SPOTS'} WITHIN 0.5 MI
          </span>
        </div>

        {/* Anchor Sponsor Banner (Matches for Fort / Cass and Sproat / Adelaide) */}
        {primarySponsor ? (
          <div className="station-anchor-card">
            <div className="anchor-glow-border" />
            <div className="anchor-content">
              <div className="anchor-badge-row">
                <span className="anchor-partner-pill">★ EXCLUSIVE STATION ANCHOR</span>
                <span className="anchor-price-tag">{primarySponsor.price}</span>
              </div>
              <div className="anchor-body">
                <span className="anchor-thumb">
                  {diningImage(primarySponsor.id) ? (
                    <img src={diningImage(primarySponsor.id)} alt={primarySponsor.name} loading="lazy" />
                  ) : (
                    <MapPin size={22} />
                  )}
                </span>
                <div className="anchor-details">
                  <h3 className="anchor-title">{primarySponsor.name}</h3>
                  <div className="anchor-meta">
                    <span>{primarySponsor.category}</span>
                    <span>·</span>
                    <span>
                      {primarySponsor.walkMiles.toFixed(2)} mi (~{primarySponsor.walkMinutes} min walk)
                    </span>
                  </div>
                  {primarySponsor.sponsorTagline && <div className="anchor-tagline">{primarySponsor.sponsorTagline}</div>}
                </div>
              </div>

              {primarySponsor.sponsorPerk && (
                <div className="anchor-perk-box">
                  <span className="perk-label">EXCLUSIVE RIDER PERK:</span>
                  <span className="perk-text">{primarySponsor.sponsorPerk}</span>
                </div>
              )}

              <div className="anchor-actions">
                <Button
                  type="button"
                  size="sm"
                  variant={restaurantId === primarySponsor.id ? 'default' : 'hudActive'}
                  className={`anchor-map-btn ${restaurantId === primarySponsor.id ? 'is-untoggle' : ''}`}
                  onClick={() => onRestaurant(primarySponsor.id)}
                >
                  <MapPin size={13} />
                  <span>{restaurantId === primarySponsor.id ? 'UNTOGGLE 3D PIN' : 'SHOW ON 3D MAP'}</span>
                </Button>
                <a href={primarySponsor.url} target="_blank" rel="noopener noreferrer" className="anchor-web-link">
                  <span>MENU &amp; VISIT</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Unclaimed Station Anchor Prompt for other QLine & DPM stops */
          <div className="claim-station-slot">
            <div className="claim-slot-inner">
              <div>
                <strong>FEATURE YOUR BUSINESS HERE</strong>
                <p>Claim the exclusive Station Anchor top spot for {station.name}.</p>
              </div>
              <a href="/pricing" className="claim-slot-btn">
                <span>VIEW TIERS</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Filter bar for standard spots */}
        <div className="dining-filter-bar">
          <div className="filter-chip-group">
            <span className="filter-chip-label">PRICE:</span>
            {(['all', '$', '$$', '$$$+'] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`filter-chip ${priceFilter === p ? 'active' : ''}`}
                onClick={() => setPriceFilter(p)}
              >
                {p === 'all' ? 'ALL' : p}
              </button>
            ))}
          </div>

          <div className="filter-chip-group">
            <span className="filter-chip-label">WALK:</span>
            {([['all', 'ANY'], [5, '≤5M'], [10, '≤10M']] as const).map(([val, lbl]) => (
              <button
                key={String(val)}
                type="button"
                className={`filter-chip ${maxMinutes === val ? 'active' : ''}`}
                onClick={() => setMaxMinutes(val as any)}
              >
                {lbl}
              </button>
            ))}
            <button
              type="button"
              className={`filter-chip ${lateNightOnly ? 'active active-warm' : ''}`}
              onClick={() => setLateNightOnly(v => !v)}
            >
              LATE NIGHT
            </button>
          </div>
        </div>

        {standardSpots.length ? (
          <div className="restaurant-list">
            {standardSpots.map(r => (
              <div
                key={r.id}
                className={`restaurant-item ${restaurantId === r.id ? 'station-selected' : ''} ${r.sponsored ? 'restaurant-sponsored' : ''}`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="restaurant-select"
                  onClick={() => onRestaurant(r.id)}
                  aria-label={`Show ${r.name} on map`}
                >
                  <span className="restaurant-thumb">
                    {diningImage(r.id) ? (
                      <img src={diningImage(r.id)} alt={`Map thumbnail of ${r.name}`} loading="lazy" />
                    ) : (
                      <MapPin size={17} />
                    )}
                  </span>
                  <span className="restaurant-main">
                    <span className="restaurant-title-row">
                      <strong>{r.name}</strong>
                      {r.sponsored && <span className="sponsor-badge">FEATURED PARTNER</span>}
                    </span>
                    <small>
                      {r.category} · {r.walkMiles.toFixed(2)} mi · ~{r.walkMinutes} min walk
                      {r.lateNight && <span className="late-indicator"> · Late Night</span>}
                    </small>
                  </span>
                  <span className="restaurant-price">{r.price}</span>
                </Button>
                <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label={`${r.name} website`} className="restaurant-arrow">
                  <ExternalLink size={15} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-search">No spots match the selected filters.</div>
        )}

        <p className="thumbnail-credit">Thumbnail maps © Mapbox © OpenStreetMap</p>
        <div className="station-actions">
          <Button variant="hudActive" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation2 size={16} /> WALKING DIRECTIONS <ExternalLink size={13} />
            </a>
          </Button>
          <div className="coordinates">
            <Compass size={14} />
            {station.coordinate[1].toFixed(4)}° N, {Math.abs(station.coordinate[0]).toFixed(4)}° W
          </div>
        </div>
      </div>

      <div className="detail-disclaimer">
        <Clock3 size={13} /> *Walk is an estimate, not a routed trip. Train times are scheduled, not live. Vehicle markers are simulated.
      </div>
    </div>
  );
}
