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
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
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
              {isBoarded ? 'NEXT STOP' : 'SCHEDULED CADENCE'} · {tickerStation.name.toUpperCase()}:
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
                    {isQLineTicker ? 'STREETCAR FREQUENCY' : 'SIMULATED LOOP CADENCE'}
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
          <span className="truncate max-w-md">
            Arrivals calculated from published headway schedules. Real-time agency telemetry currently unavailable from DTC.
          </span>
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
        <DrawerContent className="drawer-shell detail-drawer">
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
        <DrawerContent className="drawer-shell station-drawer">
          <DrawerHeader className="detail-heading">
            <div className="drawer-header-top">
              <div className="drawer-eyebrow">DETROIT TRANSIT</div>
              <DrawerClose asChild>
                <button type="button" className="drawer-close-btn" aria-label="Close station directory">
                  <X size={18} />
                </button>
              </DrawerClose>
            </div>
            <DrawerTitle>Station Directory</DrawerTitle>
            <DrawerDescription>Select any station across the People Mover and QLINE corridors.</DrawerDescription>
          </DrawerHeader>
          <div className="drawer-search-wrap">
            <label className="station-search">
              <Search size={15} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Find a station..."
                aria-label="Filter station directory"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="search-clear-btn" aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </label>
          </div>
          <div className="station-drawer-list">
            {filtered.length ? (
              filtered.map(station => (
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
              ))
            ) : (
              <div className="empty-search">No stations match "{search}".</div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(panel)} onOpenChange={open => !open && setPanel(null)}>
        <DrawerContent className="drawer-shell detail-drawer">
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
        <DrawerHeader className="detail-heading">
          <div className="drawer-header-top">
            <div className="drawer-eyebrow">DOWNTOWN CALENDAR</div>
            <DrawerClose asChild>
              <button type="button" className="drawer-close-btn" aria-label="Close activities drawer">
                <X size={18} />
              </button>
            </DrawerClose>
          </div>
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
      <DrawerHeader className="detail-heading">
        <div className="drawer-header-top">
          <div className="drawer-eyebrow">{t.league} / DETROIT SPORTS</div>
          <DrawerClose asChild>
            <button type="button" className="drawer-close-btn" aria-label="Close sports details">
              <X size={18} />
            </button>
          </DrawerClose>
        </div>
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

  // Primary Anchor Sponsor strictly matched to this station
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

  // Walk estimate from downtown center (Campus Martius [-83.0466, 42.3316])
  const walkingMiles = milesBetween([-83.0466, 42.3316], station.entrance) * 1.3;
  const walkingMinutes = Math.max(1, Math.round(walkingMiles * 20));

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const sched = stationSchedule(station.id, now);

  return (
    <div className="detail-content station-drawer-v2">
      {/* Header */}
      <DrawerHeader className="detail-heading">
        <div className="drawer-header-top">
          <div className="drawer-eyebrow">
            <span className="signal-dot" /> {isQLine ? 'QLINE' : 'PEOPLE MOVER'} <span className="detail-divider">/</span> STATION {String(number).padStart(2, '0')}
          </div>
          <DrawerClose asChild>
            <button type="button" className="drawer-close-btn" aria-label="Close station drawer">
              <X size={18} />
            </button>
          </DrawerClose>
        </div>
        <div className="station-title-row">
          <DrawerTitle className="station-main-title">{station.name}</DrawerTitle>
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
        <DrawerDescription className="station-sub-location">
          {station.neighborhood}, Detroit · {station.crossStreets}
        </DrawerDescription>
      </DrawerHeader>

      {/* 3-Column Top Stats Grid */}
      <div className="stat-tri-grid">
        <div className="stat-tri-cell">
          <span className="stat-tri-label">WALK FROM CAMPUS MARTIUS*</span>
          <div className="stat-tri-value">
            <span className="stat-tri-accent">{walkingMinutes}</span> min <span className="stat-tri-sub">· ~{walkingMiles.toFixed(1)} mi</span>
          </div>
        </div>
        <div className="stat-tri-cell">
          <span className="stat-tri-label">NEXT STOP</span>
          <div className="stat-tri-next-name">{next.name}</div>
        </div>
        <div className="stat-tri-cell">
          <span className="stat-tri-label">SERVICE NOW</span>
          <div className={`stat-tri-status ${sched.running || isQLine ? 'is-running' : 'not-running'}`}>
            {isQLine ? 'Active' : sched.running ? 'Running' : 'Not running'}
          </div>
        </div>
      </div>

      {/* Station Wayfinding & Entrance Guide */}
      <div className="wayfinding-card">
        <div className="wayfinding-header">
          <div className="wayfinding-title-group">
            <Accessibility size={16} className="text-cyan-400" />
            <span>STATION WAYFINDING &amp; ENTRANCE GUIDE</span>
          </div>
          <div className={`wayfinding-elevator-pill ${station.elevator ? 'elevator-yes' : 'elevator-no'}`}>
            {station.elevator ? 'ELEVATOR AVAILABLE' : 'STAIRS / RAMP'}
          </div>
        </div>

        <p className="wayfinding-body-text">{station.entranceNotes}</p>

        <div className="wayfinding-meta-row">
          <span className="wayfinding-meta-tag">CROSS STREETS:</span>
          <span className="wayfinding-meta-val">{station.crossStreets}</span>
        </div>

        <div className="wayfinding-meta-row">
          <span className="wayfinding-meta-tag">ADA STATUS:</span>
          <span className="wayfinding-meta-val">
            {station.adaCompliant ? 'Fully Accessible' : 'Limited Access / Check Elevator'}
          </span>
        </div>
      </div>

      {/* Scheduled Timetable Section */}
      <div className="timetable-section">
        <div className="timetable-header">
          <span className="timetable-heading">NEXT TRAINS · SCHEDULED</span>
          <span className="timetable-subheading">OFFICIAL TIMETABLE</span>
        </div>

        {isQLine ? (
          <div className="timetable-rows">
            <div className="timetable-row">
              <div className="timetable-clock-box">
                <Clock3 size={18} />
              </div>
              <div className="timetable-time-col">
                <div className="timetable-primary-time">Every 10–15 Min</div>
                <div className="timetable-day-note">Regular streetcar frequency</div>
              </div>
              <div className="timetable-status-tag">ACTIVE</div>
            </div>
          </div>
        ) : sched.trains.length > 0 ? (
          <div className="timetable-rows">
            {sched.trains.slice(0, 3).map((train, i) => (
              <div key={i} className="timetable-row">
                <div className="timetable-clock-box">
                  <Clock3 size={18} />
                </div>
                <div className="timetable-time-col">
                  <div className="timetable-primary-time">{train.time}</div>
                  <div className="timetable-day-note">
                    {train.minutes <= 0 ? 'Due at platform' : train.minutes <= 15 ? `In ~${train.minutes} min` : train.day ? train.day : 'Scheduled run'}
                  </div>
                </div>
                {train.minutes > 0 && train.minutes <= 10 && (
                  <span className="timetable-pill-due">APPROACHING</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="timetable-empty">Service currently closed. Next service begins tomorrow at 6:00 AM.</div>
        )}
      </div>

      {/* Station Anchor & Dining Section */}
      <div className="dining-block">
        <div className="dining-section-header">
          <span className="dining-section-title">STATION ANCHOR &amp; DINING</span>
          <a href="/pricing" className="dining-section-link">
            LOCAL HUBS <ExternalLink size={12} />
          </a>
        </div>

        {/* Exclusive Anchor Partner Spot */}
        {primarySponsor ? (
          <div className="anchor-spot-wrapper">
            <div className="anchor-spot-eyebrow">
              <span className="anchor-spot-dot" /> OFFICIAL STATION PARTNER SPOT
            </div>
            <div className="anchor-spot-box">
              <div className="anchor-spot-top">
                <div className="anchor-spot-thumb">
                  {diningImage(primarySponsor.id) ? (
                    <img src={diningImage(primarySponsor.id)} alt={primarySponsor.name} loading="lazy" />
                  ) : (
                    <MapPin size={22} />
                  )}
                </div>
                <div className="anchor-spot-info">
                  <div className="anchor-spot-name-row">
                    <h3 className="anchor-spot-name">{primarySponsor.name}</h3>
                    <span className="anchor-spot-price">{primarySponsor.price}</span>
                  </div>
                  <div className="anchor-spot-meta">
                    {primarySponsor.category} · {primarySponsor.walkMiles.toFixed(2)} mi (~{primarySponsor.walkMinutes} min walk)
                  </div>
                  <div className="anchor-spot-partner-tag">
                    {primarySponsor.sponsorTagline ?? 'Official Downtown Anchor Partner'}
                  </div>
                </div>
              </div>

              {primarySponsor.sponsorPerk && (
                <div className="anchor-perk-container">
                  <div className="anchor-perk-label">EXCLUSIVE RIDER PERK:</div>
                  <div className="anchor-perk-body">{primarySponsor.sponsorPerk}</div>
                </div>
              )}

              <div className="anchor-btn-grid">
                <button
                  type="button"
                  className={`anchor-action-btn ${restaurantId === primarySponsor.id ? 'active' : ''}`}
                  onClick={() => onRestaurant(primarySponsor.id)}
                >
                  <MapPin size={14} />
                  <span>{restaurantId === primarySponsor.id ? 'UNTOGGLE 3D PIN' : 'SHOW ON 3D MAP'}</span>
                </button>
                <a
                  href={primarySponsor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="anchor-action-btn anchor-action-visit"
                >
                  <span>MENU &amp; VISIT</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="unclaimed-anchor-banner">
            <div>
              <div className="unclaimed-title">★ CLAIM THIS STATION ANCHOR</div>
              <p className="unclaimed-text">Lock in the exclusive top spot for {station.name}.</p>
            </div>
            <a href="/pricing" className="unclaimed-btn">
              CLAIM SLOT <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Filter Bar */}
        <div className="filters-strip">
          <div className="filter-group">
            <span className="filter-title">PRICE:</span>
            {(['all', '$', '$$', '$$$+'] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`filter-button ${priceFilter === p ? 'selected' : ''}`}
                onClick={() => setPriceFilter(p)}
              >
                {p === 'all' ? 'ALL' : p}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-title">WALK:</span>
            {([['all', 'ANY'], [5, '≤5M'], [10, '≤10M']] as const).map(([val, lbl]) => (
              <button
                key={String(val)}
                type="button"
                className={`filter-button ${maxMinutes === val ? 'selected' : ''}`}
                onClick={() => setMaxMinutes(val as any)}
              >
                {lbl}
              </button>
            ))}
            <button
              type="button"
              className={`filter-button ${lateNightOnly ? 'selected-warm' : ''}`}
              onClick={() => setLateNightOnly(v => !v)}
            >
              LATE NIGHT
            </button>
          </div>
        </div>

        {/* Restaurants List */}
        {standardSpots.length > 0 ? (
          <div className="restaurants-scroll-list">
            {standardSpots.map(r => (
              <div
                key={r.id}
                className={`restaurant-row-card ${restaurantId === r.id ? 'is-selected' : ''}`}
                onClick={() => onRestaurant(r.id)}
              >
                <div className="restaurant-thumb-box">
                  {diningImage(r.id) ? (
                    <img src={diningImage(r.id)} alt={r.name} loading="lazy" />
                  ) : (
                    <MapPin size={18} />
                  )}
                </div>
                <div className="restaurant-info-box">
                  <div className="restaurant-name-header">
                    <span className="restaurant-name">{r.name}</span>
                  </div>
                  <div className="restaurant-meta-line">
                    {r.category} · {r.walkMiles.toFixed(2)} mi · ~{r.walkMinutes} min walk
                    {r.lateNight && <span className="restaurant-late-tag"> · Late Night</span>}
                  </div>
                </div>
                <div className="restaurant-actions-box">
                  <span className="restaurant-price-indicator">{r.price}</span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="restaurant-external-link"
                    onClick={e => e.stopPropagation()}
                    aria-label={`Open ${r.name} menu`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-search">No spots match the selected filters.</div>
        )}

        {/* Directions & Footer */}
        <div className="station-actions-row">
          <Button variant="hudActive" asChild className="directions-cta-btn">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Navigation2 size={16} /> WALKING DIRECTIONS <ExternalLink size={13} />
            </a>
          </Button>
          <div className="coordinates-label">
            <Compass size={14} />
            {station.coordinate[1].toFixed(4)}° N, {Math.abs(station.coordinate[0]).toFixed(4)}° W
          </div>
        </div>
      </div>

           <div className="detail-disclaimer">
        <Clock3 size={13} /> Arrivals calculated from published headway schedules. Real-time agency telemetry currently unavailable from DTC. Vehicle markers are simulated.
      </div>
    </div>
  );
}
