import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useMemo, type ComponentType } from 'react';
import {
  Accessibility,
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
  RotateCcw,
  Route as RouteIcon,
  Search,
  Timer,
  X,
  HelpCircle,
  Building,
  Flag,
  Sparkles,
  Waves,
  Trees,
  Trophy,
  Footprints,
  SquareParking,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StationDirectory from '@/components/StationDirectory';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  peopleMoverStations,
  qlineStations,
  allTransitStations,
  nearbyRestaurants,
  restaurants,
  sportsTeams,
  activities,
  milesBetween,
  popularHotels,
  canadaTransitGuide,
  destinationShortcuts,
  howDoIFlows,
  calculateFlexibleRoute,
  stationSlotAssignments,
  type Station,
  type Place,
  type StationSlot,
  type HotelGuide,
  type DestinationShortcut,
  type HowDoIFlow,
} from '@/data/transit';
import { qlineStatus, qlineStationSchedule, QLINE_HEADWAY_MINUTES } from '@/data/qlineSchedule';
import { nearbyParking, parkingGarages } from '@/data/parking';
import { getNextTrainForStation } from '@/data/trainSimulation';
import { stationSchedule } from '@/data/schedule';
import { useStationAlert } from '@/hooks/useStationAlert';
import logo from '@/assets/dpm-go-logo.jpg.asset.json';

const diningImages = import.meta.glob<{ url: string }>('/src/assets/dining/*.asset.json', { eager: true, import: 'default' });
const diningImage = (id: string) => diningImages[`/src/assets/dining/${id}.jpg.asset.json`]?.url;

// Auto-resolves authentic brand mark from local asset or domain favicon
function getVenueLogo(venue: { id: string; url?: string; imageUrl?: string }): string | null {
  if (venue.imageUrl) return venue.imageUrl;
  const local = diningImage(venue.id);
  if (local) return local;
  if (venue.url) {
    try {
      const hostname = new URL(venue.url).hostname.replace(/^www\./, '');
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
      return null;
    }
  }
  return null;
}
type MapProps = {
  peopleMover: boolean;
  qline: boolean;
  parking: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReady?: (ready: boolean) => void;
  restaurantId?: string | null;
  isBoarded?: boolean;
  userPosition?: [number, number] | null;
  followUser?: boolean;
};

// Icon language shared by the desktop preset pills and the mobile Quick Routes menu.
const HOW_DO_I_ICONS: Record<HowDoIFlow['id'], LucideIcon> = {
  hotel: Building,
  canada: Flag,
  'campus-martius': Sparkles,
  riverfront: Waves,
};

const DESTINATION_ICONS: Record<string, LucideIcon> = {
  trees: Trees,
  sparkles: Sparkles,
  waves: Waves,
};

const DISCLAIMER_COPY =
  'DPM - Go! is an open-source project under Motorcity Automated Systems, LLC and is not associated with the DTC or the official Detroit People Mover entity.';

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
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShareApp = async () => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'DPM - Go! | Detroit Transit HUD',
        text: 'Live 3D Detroit People Mover & QLINE transit companion.',
        url: window.location.origin,
      });
    } catch {
      // User dismissed share dialog
    }
  } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(window.location.origin);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  }
};

  const [MapComponent, setMapComponent] = useState<ComponentType<MapProps> | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [peopleMover, setPeopleMover] = useState(true);
  const [qline, setQline] = useState(true);
  const [parking, setParking] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stationListOpen, setStationListOpen] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  // Declared before the route memo below reads it during render.
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  // Quick Navigation & Flexible Boarding state
  const [quickNavOpen, setQuickNavOpen] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<DestinationShortcut | null>(null);
  const [activeHowDoI, setActiveHowDoI] = useState<HowDoIFlow | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelGuide>(popularHotels[0]!);
  const [manualOriginId, setManualOriginId] = useState<string | null>(null);

  // Compute target destination object for flexible routing
  const activeTargetDestination = useMemo(() => {
    if (activeShortcut) return activeShortcut;
    if (activeHowDoI?.id === 'hotel') return selectedHotel;
    if (activeHowDoI?.id === 'canada') return canadaTransitGuide;
    if (activeHowDoI?.id === 'campus-martius') {
      return destinationShortcuts.find(d => d.id === 'campus-martius') || destinationShortcuts[4]!;
    }
    if (activeHowDoI?.id === 'riverfront') {
      return destinationShortcuts.find(d => d.id === 'hart-plaza') || destinationShortcuts[5]!;
    }
    return destinationShortcuts[0]!;
  }, [activeShortcut, activeHowDoI, selectedHotel]);

  // Compute calculated flexible route
  const flexibleRoute = useMemo(() => {
    return calculateFlexibleRoute({
      userCoordinate: userPos,
      manualOriginStationId: manualOriginId,
      targetDestination: activeTargetDestination,
    });
  }, [userPos, manualOriginId, activeTargetDestination]);

  // Handler to trigger 3D map fly-to
  const handleFlyToTarget = (targetName: string, coord: [number, number]) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dpm-map-flyto', {
          detail: {
            center: coord,
            zoom: 17.2,
            pitch: 58,
            bearing: -15,
            targetName,
          },
        })
      );
    }
  };

  const openDestinationShortcut = (shortcut: DestinationShortcut) => {
    setActiveShortcut(shortcut);
    setActiveHowDoI(null);
    setQuickNavOpen(true);
    handleFlyToTarget(shortcut.name, shortcut.coordinate);
  };

  const openHowDoIFlow = (flow: HowDoIFlow) => {
    setActiveHowDoI(flow);
    setActiveShortcut(null);
    setQuickNavOpen(true);
    if (flow.id === 'hotel') {
      handleFlyToTarget(selectedHotel.name, selectedHotel.coordinate);
    } else if (flow.id === 'canada') {
      handleFlyToTarget(canadaTransitGuide.terminalName, canadaTransitGuide.terminalCoordinate);
    } else if (flow.id === 'campus-martius') {
      const target = destinationShortcuts.find(d => d.id === 'campus-martius')!;
      handleFlyToTarget(target.name, target.coordinate);
    } else if (flow.id === 'riverfront') {
      const target = destinationShortcuts.find(d => d.id === 'hart-plaza')!;
      handleFlyToTarget(target.name, target.coordinate);
    }
  };

  // Reset the map: drop every marked location (the quick route pin, the
  // restaurant pin and the selected station) and fly back to the default
  // downtown overview.
  const handleResetMap = () => {
    setRestaurantId(null);
    setSelectedId(null);
    setActiveShortcut(null);
    setActiveHowDoI(null);
    setQuickNavOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpm-map-reset'));
    }
  };
  const [isBoarded, setIsBoarded] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [followUser, setFollowUser] = useState(false);

  // GPS watcher: the rider position is tracked the whole time so the boarding
  // station can be detected automatically and the map can lock onto the rider.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    let cancelled = false;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        if (cancelled) return;
        setUserPos([pos.coords.longitude, pos.coords.latitude]);
        setGpsError(null);
      },
      err => {
        if (cancelled) return;
        // A denied or unavailable GPS must never break the map.
        setGpsError(err.code === err.PERMISSION_DENIED ? 'Location permission denied' : 'Location unavailable');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const toggleRestaurant = (id: string) => {
    setRestaurantId(prev => (prev === id ? null : id));
  };

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [dontShowWalkthroughAgain, setDontShowWalkthroughAgain] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    try {
      const seen = typeof window !== 'undefined' ? localStorage.getItem('dpmgo_walkthrough_seen') : null;
      if (!seen) {
        timer = window.setTimeout(() => {
          setWalkthroughOpen(true);
        }, 1300);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  const dismissWalkthrough = (permanently: boolean) => {
    setWalkthroughOpen(false);
    if (permanently || dontShowWalkthroughAgain) {
      try {
        localStorage.setItem('dpmgo_walkthrough_seen', 'true');
      } catch {}
    }
  };

  const [panel, setPanel] = useState<null | 'activities' | string>(null);
  const [legal, setLegal] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);
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

  // Announce the selected stop for screen reader users. The map pins are
  // drawn on a canvas, so the station directory is the accessible route.
  const announcement = useMemo(() => {
    if (!selected) return '';
    const line = selected.line === 'qline' ? 'QLINE streetcar' : 'People Mover';
    const lineStations = selected.line === 'qline' ? qlineStations : peopleMoverStations;
    const index = lineStations.findIndex(station => station.id === selected.id);
    const next = lineStations[(index + 1) % lineStations.length];
    return `${selected.name} selected on the ${line}. Next stop ${next?.name ?? 'unknown'}.`;
  }, [selected]);
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
  const qlineLive = useMemo(() => qlineStatus(now), [now]);

  // The arrival readout shares the fleet clock with the map, so the vehicle
  // that is drawn on the loop is the vehicle this countdown is counting down.
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
            parking={parking}
            selectedId={selectedId}
            onSelect={openStation}
            onReady={setMapReady}
            restaurantId={restaurantId}
            isBoarded={isBoarded}
            userPosition={userPos}
            followUser={followUser}
          />
        )}
        <div className="map-vignette" />
      </div>

      <div className="interface-shell">
        <a className="skip-link" href="#station-directory">
          Skip to the station directory
        </a>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>
        <header className="topbar">
          <div className="brand-block">
            <img src={logo.url} alt="DPM - Go!" className="brand-logo" />
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
            {/* Quick Routes: the combined "How Do I?" + "I'm Going To" preset menu.
                It replaces the two preset scroll rows on phones, where there is no
                room for both rows above the map. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="hudOutline"
                  size="hud"
                  className="quick-routes-trigger"
                  aria-label="Open the Quick Routes menu"
                >
                  <Compass size={14} />
                  <span>QUICK ROUTES!</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="quick-routes-menu">
                <DropdownMenuLabel className="quick-routes-menu-label">HOW DO I?</DropdownMenuLabel>
                {howDoIFlows.map(flow => {
                  const Icon = HOW_DO_I_ICONS[flow.id];
                  return (
                    <DropdownMenuItem
                      key={flow.id}
                      onSelect={() => openHowDoIFlow(flow)}
                      className={activeHowDoI?.id === flow.id ? 'quick-routes-item is-active' : 'quick-routes-item'}
                    >
                      <Icon size={14} />
                      <span>{flow.title}</span>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="quick-routes-menu-label">I’M GOING TO:</DropdownMenuLabel>
                {destinationShortcuts.map(dest => {
                  const Icon = DESTINATION_ICONS[dest.icon] ?? Trophy;
                  return (
                    <DropdownMenuItem
                      key={dest.id}
                      onSelect={() => openDestinationShortcut(dest)}
                      className={
                        activeShortcut?.id === dest.id ? 'quick-routes-item is-active' : 'quick-routes-item'
                      }
                    >
                      <Icon size={14} />
                      <span>{dest.name}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="hudOutline" size="hud" className="station-list-btn" onClick={() => setStationListOpen(true)}>
              <Layers3 size={14} />
              <span>STATIONS</span>
            </Button>
          </div>
        </header>

        {/* QUICK NAVIGATION & "HOW DO I?" SHORTCUTS HUD */}
        <div className="dpm-quick-nav-bar">
          <div className="dpm-quick-nav-group">
            <span className="dpm-quick-nav-title">
              <Compass size={11} /> HOW DO I?
            </span>
            <div className="dpm-quick-nav-scroll">
              <button
                type="button"
                className={`dpm-nav-pill ${activeHowDoI?.id === 'hotel' ? 'active' : ''}`}
                onClick={() => openHowDoIFlow(howDoIFlows[0]!)}
              >
                <Building size={12} />
                <span>Hotel</span>
              </button>
              <button
                type="button"
                className={`dpm-nav-pill ${activeHowDoI?.id === 'canada' ? 'active' : ''}`}
                onClick={() => openHowDoIFlow(howDoIFlows[1]!)}
              >
                <Flag size={12} />
                <span>Canada</span>
              </button>
              <button
                type="button"
                className={`dpm-nav-pill ${activeHowDoI?.id === 'campus-martius' ? 'active' : ''}`}
                onClick={() => openHowDoIFlow(howDoIFlows[2]!)}
              >
                <Sparkles size={12} />
                <span>Campus Martius</span>
              </button>
              <button
                type="button"
                className={`dpm-nav-pill ${activeHowDoI?.id === 'riverfront' ? 'active' : ''}`}
                onClick={() => openHowDoIFlow(howDoIFlows[3]!)}
              >
                <Waves size={12} />
                <span>Riverfront</span>
              </button>
            </div>
          </div>

          <div className="dpm-quick-nav-group destination-group">
            <span className="dpm-quick-nav-title">
              <Navigation2 size={11} /> I’M GOING TO:
            </span>
            <div className="dpm-quick-nav-scroll">
              {destinationShortcuts.map(dest => (
                <button
                  key={dest.id}
                  type="button"
                  className={`dpm-nav-pill dest-pill ${activeShortcut?.id === dest.id ? 'active' : ''}`}
                  onClick={() => openDestinationShortcut(dest)}
                >
                  <Trophy size={12} />
                  <span>{dest.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
              {isBoarded
                ? 'NEXT STOP'
                : isQLineTicker
                  ? 'SCHEDULED CADENCE'
                  : 'SIMULATED CADENCE'}{' '}
              · {tickerStation.name.toUpperCase()}:
            </span>
            <strong className="mobile-countdown-val">
              {isQLineTicker
                ? qlineLive.running
                  ? qlineLive.nextDepartureLabel
                  : 'OFFLINE'
                : tickerSchedule.running
                  ? liveArrival.formatted
                  : 'OFFLINE'}
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
            <Button
              type="button"
              variant={followUser ? 'default' : 'outline'}
              size="sm"
              className={`boarded-mode-btn ${followUser ? 'is-boarded' : ''}`}
              disabled={!userPos}
              onClick={() => setFollowUser(v => !v)}
              title={gpsError ?? 'Lock the map onto your device location'}
            >
              <LocateFixed size={13} className={followUser ? 'animate-pulse text-cyan-300' : ''} />
              <span>{gpsError ? 'GPS UNAVAILABLE' : followUser ? 'FOLLOWING YOU' : 'LOCK MAP TO ME'}</span>
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
            <Button
              variant={parking ? 'hudWarm' : 'hudInactive'}
              size="route"
              aria-pressed={parking}
              onClick={() => setParking(v => !v)}
            >
              <SquareParking size={12} /> PARKING <span className="route-pill-state">{parking ? 'ON' : 'OFF'}</span>
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
                      qlineLive.running ? (
                        <>
                          HEADWAY: <strong>{QLINE_HEADWAY_MINUTES}</strong> MIN <small>({qlineLive.nextDepartureLabel})</small>
                        </>
                      ) : (
                        <>
                          <span className="ticker-off-hours">SERVICE SUSPENDED</span> <small>({qlineLive.nextDepartureLabel})</small>
                        </>
                      )
                    ) : tickerSchedule.running ? (
                      // The People Mover readout follows the drawn fleet, so the
                      // countdown and the vehicle on the map always agree.
                      liveArrival.atPlatform ? (
                        <strong className="ticker-due-now">DUE AT PLATFORM</strong>
                      ) : (
                        <>
                          IN <strong>{liveArrival.minutes}</strong> MIN <small>(SIMULATED)</small>
                        </>
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
          </div>          <label className="station-search">
            <Search size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a station..." aria-label="Find a station" />
            <kbd>⌕</kbd>
          </label>
          <div className="station-scroll" id="station-directory">
            <StationDirectory
              stations={filtered}
              numbering={activeStations}
              selectedId={selectedId}
              onSelect={openStation}
              label="Transit stations"
            />
          </div>
          {parking && (
            <>
              <div className="panel-rule" />
              <div className="panel-section-title">
                <span>PARK ONCE DIRECTORY</span>
                <span>02 — {String(parkingGarages.length).padStart(2, '0')}</span>
              </div>
              <div className="station-scroll">
                {parkingGarages.map(garage => (
                  <Button
                    key={garage.id}
                    variant="station"
                    size="station"
                    onClick={() => handleFlyToTarget(garage.name, garage.coordinate)}
                  >
                    <span className="station-number">{garage.parkOnce ? 'P1' : 'P0'}</span>
                    <span className="station-track">
                      <span className="station-node" />
                    </span>
                    <span className="station-name">{garage.name}</span>
                    <ArrowRight size={14} className="station-arrow" />
                  </Button>
                ))}
              </div>
              <div className="panel-bottom">
                <span>
                  <span className="tiny-diamond" /> RATES CONFIRM ON ARRIVAL
                </span>
                <span>{parkingGarages.filter(g => g.parkOnce).length} PARK ONCE</span>
              </div>
            </>
          )}
          {!parking && (
            <div className="panel-bottom">
              <span>
                <span className="tiny-diamond" /> INTERACTIVE PLATFORMS
              </span>
              <span>SIMULATED VEHICLES</span>
            </div>
          )}
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
            className="map-reset-btn"
            title="Reset map view and clear marked locations"
            aria-label="Reset map view and clear marked locations"
            onClick={handleResetMap}
          >
            <RotateCcw size={16} />
            <span className="map-reset-btn-label">RESET MAP VIEW</span>
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
          {parking && (
            <span>
              <i className="legend-line warm-line" /> PARKING GARAGE
            </span>
          )}
        </div>

        {/* Mobile bottom sheet launcher for the station directory */}
        <Button
          variant="mobileStations"
          size="hud"
          className="mobile-station-trigger"
          onClick={() => setStationListOpen(true)}
        >
          <Layers3 size={15} />
          <span>STATIONS</span>
          <ChevronDown size={15} />
        </Button>

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
          <div className="footer-brand-wrap">
            <span className="footer-title">MOTORCITY AUTOMATED SYSTEMS</span>
            <span className="footer-sub">Building Targeted Autonomous Civic-Tech Solutions</span>
          </div>

          <div className="footer-links">
            <a
              href="https://www.thepeoplemover.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-external"
            >
              thepeoplemover.com <ExternalLink size={11} />
            </a>
            <span className="footer-divider">·</span>
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="legal-btn footer-guide-btn"
            >
              <HelpCircle size={11} /> How It Works
            </button>
            <span className="footer-divider">·</span>
            <button type="button" onClick={() => setLegal('terms')} className="legal-btn">
              Terms &amp; Conditions
            </button>
            <span className="footer-divider">·</span>
            <button type="button" onClick={() => setLegal('privacy')} className="legal-btn">
              Privacy Policy
            </button>
            <span className="footer-divider">·</span>
            <button type="button" onClick={() => setLegal('disclaimer')} className="legal-btn">
              Disclaimer
            </button>
            <span className="footer-divider">·</span>
            <a href="/admin" className="legal-btn">
              Partner Admin
            </a>
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
            <StationDirectory
              stations={filtered}
              numbering={activeStations}
              selectedId={selectedId}
              onSelect={openStation}
              label="Transit stations"
              showLine
            />
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
            <DialogTitle>
              {legal === 'terms' ? 'Terms and Conditions' : legal === 'privacy' ? 'Privacy Policy' : 'Disclaimer'}
            </DialogTitle>
            <DialogDescription>
              Software developed by Motorcity Automated Systems, LLC.
            </DialogDescription>
          </DialogHeader>
          <div className="legal-body">
            {legal === 'terms' ? (
              <>
                <p>
                  <strong>Disclaimer of Transit Data &amp; Timetables:</strong> DPM - Go! is an independent utility created to assist
                  Detroit transit riders. All schedules, next-train countdowns, and moving vehicle markers represent published GTFS
                  timetables and visual simulations. Motorcity Automated Systems, LLC make no guarantee of
                  real-time accuracy and expressly disclaim all liability for transit delays, service interruptions, or missed connections.
                </p>
                <p>
                  <strong>Third-Party Venues:</strong> Restaurant walking metrics, menus, and external links are provided for convenience.
                  Motorcity Automated Systems, LLC does not operate or endorse third-party establishments.
                </p>
              </>
            ) : legal === 'disclaimer' ? (
              <>
                <p>
                  <strong>Disclaimer:</strong> {DISCLAIMER_COPY}
                </p>
                <p>
                  <strong>Transit Data &amp; Timetables:</strong> All schedules, next-train countdowns and moving vehicle markers represent
                  published GTFS timetables and visual simulations. Real-time agency telemetry is currently unavailable from DTC, so no
                  arrival estimate in this app is a live feed.
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


      {/* QUICK NAVIGATION & FLEXIBLE BOARDING DIALOG */}
      <Dialog open={quickNavOpen} onOpenChange={setQuickNavOpen}>
        <DialogContent className="quick-nav-dialog">
          <div className="quick-nav-header">
            <div className="quick-nav-badge">
              <Compass size={12} />
              <span>
                {activeHowDoI ? activeHowDoI.badge : activeShortcut?.category?.toUpperCase()}
              </span>
            </div>
            <DialogTitle className="quick-nav-title">
              {flexibleRoute.destinationHubName}
            </DialogTitle>
            <DialogDescription className="quick-nav-subtitle">
              {activeShortcut?.description ||
                (activeHowDoI?.id === 'hotel'
                  ? 'Guided transit & walking directions back to your downtown hotel room.'
                  : activeHowDoI?.id === 'canada'
                  ? 'Official cross-border tunnel bus connection between Detroit and Windsor, Ontario.'
                  : activeHowDoI?.shortDesc)}
            </DialogDescription>
          </div>

          {/* Hotel Selector if Hotel Flow */}
          {activeHowDoI?.id === 'hotel' && (
            <div className="quick-nav-hotel-selector">
              <label htmlFor="hotel-select" className="quick-nav-field-label">
                SELECT YOUR HOTEL:
              </label>
              <select
                id="hotel-select"
                value={selectedHotel.id}
                onChange={e => {
                  const hotel = popularHotels.find(h => h.id === e.target.value);
                  if (hotel) {
                    setSelectedHotel(hotel);
                    handleFlyToTarget(hotel.name, hotel.coordinate);
                  }
                }}
                className="quick-nav-dropdown"
              >
                {popularHotels.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.address})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Canada Cross-Border Transit Notice */}
          {activeHowDoI?.id === 'canada' && (
            <div className="canada-travel-banner">
              <div className="canada-banner-header">
                <Flag size={14} className="text-red-400" />
                <strong>INTERNATIONAL CROSS-BORDER TRANSIT</strong>
              </div>
              <p className="canada-banner-desc">
                The <strong>Transit Windsor Tunnel Bus</strong> departs from the Mariners’ Church Tunnel Plaza (170 E Jefferson Ave), just 1 block from Financial District / Millender Center Stations.
              </p>
              <div className="canada-requirements-grid">
                <div>
                  <span className="req-label">REQUIRED DOCUMENTS:</span>
                  <ul className="req-list">
                    {canadaTransitGuide.documentRequirements.map((req, idx) => (
                      <li key={idx}>✓ {req}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="req-label">FARES &amp; PAYMENT:</span>
                  <p className="req-text">
                    {canadaTransitGuide.fareCAD} · {canadaTransitGuide.paymentMethod}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FLEXIBLE BOARDING LOGIC SELECTOR */}
          <div className="quick-nav-boarding-box">
            <div className="quick-nav-boarding-header">
              <span className="boarding-label">BOARDING STATION (STARTING POINT):</span>
              <span className="boarding-mode-tag">
                {userPos && !manualOriginId ? '📍 AUTO-DETECTED (GPS)' : 'MANUAL'}
              </span>
            </div>
            <select
              value={manualOriginId ?? '__auto__'}
              onChange={e => setManualOriginId(e.target.value === '__auto__' ? null : e.target.value)}
              className="quick-nav-dropdown"
            >
              <option value="__auto__">
                {userPos ? '📍 Nearest to me' : 'Auto'} — {flexibleRoute.originStation.name}
              </option>
              <optgroup label="People Mover Loop Stations">
                {peopleMoverStations.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {userPos && milesBetween(userPos, s.coordinate) < 0.25 ? '(Near You)' : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="QLINE Woodward Streetcar">
                {qlineStations.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Woodward Ave)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* STEP-BY-STEP ROUTE ITINERARY */}
          <div className="quick-nav-steps">
            {/* Step 1: Boarding */}
            <div className="route-step">
              <div className="route-step-indicator">1</div>
              <div className="route-step-content">
                <div className="route-step-title">
                  Board at <strong>{flexibleRoute.originStation.name}</strong>
                </div>
                <div className="route-step-note">
                  {flexibleRoute.line === 'mover' ? (
                    <span className="line-chip mover">Detroit People Mover (Elevated Loop)</span>
                  ) : (
                    <span className="line-chip qline">QLINE Woodward Streetcar</span>
                  )}
                  <span className="free-fare-badge">100% FREE FARE</span>
                </div>
              </div>
            </div>

            {/* Step 2: Transit Ride */}
            <div className="route-step">
              <div className="route-step-indicator">2</div>
              <div className="route-step-content">
                {flexibleRoute.stopsCount === 0 ? (
                  <div className="route-step-title">
                    Already at <strong>{flexibleRoute.destinationStation.name}</strong>
                  </div>
                ) : (
                  <div className="route-step-title">
                    Ride <strong>{flexibleRoute.stopsCount} stop{flexibleRoute.stopsCount === 1 ? '' : 's'}</strong> (~{flexibleRoute.estimatedRideMinutes} mins)
                  </div>
                )}
                {flexibleRoute.legs.map(leg => (
                  <div className="intermediate-stops" key={`leg-${leg.line}-${leg.toStation.id}`}>
                    {leg.line === 'mover' ? 'People Mover' : 'QLINE'}
                    {leg.intermediateStations.length > 0
                      ? ` passing ${leg.intermediateStations.join(' → ')}`
                      : ` direct to ${leg.toStation.name}`}
                  </div>
                ))}
                {flexibleRoute.transferStation && (
                  <div className="route-step-note">
                    Transfer at <strong>{flexibleRoute.transferStation.name}</strong> — walk ~{flexibleRoute.transferWalkMinutes} min to the{' '}
                    {flexibleRoute.legs[1]?.line === 'qline' ? 'QLINE' : 'People Mover'} platform.
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Exit Station */}
            <div className="route-step">
              <div className="route-step-indicator">3</div>
              <div className="route-step-content">
                <div className="route-step-title">
                  Exit at <strong>{flexibleRoute.destinationStation.name}</strong>
                </div>
                <div className="route-step-note">
                  {flexibleRoute.destinationStation.entranceNotes ||
                    'Take elevator or platform stairs down to street level.'}
                </div>
              </div>
            </div>

            {/* Step 4: Walking */}
            <div className="route-step">
              <div className="route-step-indicator">4</div>
              <div className="route-step-content">
                <div className="route-step-title">
                  <Footprints size={14} className="inline mr-1 text-cyan-400" />
                  Walk {flexibleRoute.walkingDistanceMiles} mi (~{flexibleRoute.walkingMinutes} min) to {flexibleRoute.destinationHubName}
                </div>
                <div className="route-step-note">
                  {flexibleRoute.walkingDirections}
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS: 3D MAP FLYTO & ALARM */}
          <div className="quick-nav-actions">
            <Button
              variant="hudOutline"
              className="quick-nav-action-btn map-btn"
              onClick={() => {
                handleFlyToTarget(
                  flexibleRoute.destinationHubName,
                  flexibleRoute.targetCoordinate
                );
                setQuickNavOpen(false);
              }}
            >
              <Compass size={14} />
              <span>FLY TO 3D MAP</span>
            </Button>

            <Button
              variant="default"
              className="quick-nav-action-btn alarm-btn"
              onClick={() => {
                alertSystem.armAlert(flexibleRoute.destinationStation);
                setQuickNavOpen(false);
              }}
            >
              <Bell size={14} />
              <span>NOTIFY ON ARRIVAL</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Walkthrough & Onboarding Guide Dialog */}
      <Dialog open={walkthroughOpen} onOpenChange={open => !open && dismissWalkthrough(false)}>
        <DialogContent className="walkthrough-dialog">
          <div className="walkthrough-header">
            <div className="walkthrough-eyebrow">
              <Compass size={13} />
              <span>RIDER QUICK GUIDE</span>
            </div>
            <DialogTitle>How DPM - Go! Works</DialogTitle>
            <DialogDescription className="walkthrough-subtitle">
              Your lightweight companion for navigating the Detroit People Mover &amp; QLINE transit corridors.
            </DialogDescription>
          </div>

          <div className="walkthrough-body">
            <div className="walkthrough-step">
              <div className="walkthrough-step-icon">
                <Compass size={18} />
              </div>
              <div className="walkthrough-step-content">
                <div className="walkthrough-step-title">1. Interactive 3D Transit Map</div>
                <p className="walkthrough-step-desc">
                  Tap any station node on the map or tap <strong>STATIONS</strong> to view scheduled departures, elevator accessibility status, and walking wayfinding.
                </p>
              </div>
            </div>

            <div className="walkthrough-step">
              <div className="walkthrough-step-icon">
                <LocateFixed size={18} />
              </div>
              <div className="walkthrough-step-content">
                <div className="walkthrough-step-title">2. "Boarded" GPS Following</div>
                <p className="walkthrough-step-desc">
                  Riding the train? Tap <strong>BOARDED</strong> in the top bar to follow your GPS movement along the elevated track loop directly in your browser.
                </p>
              </div>
            </div>

            <div className="walkthrough-step">
              <div className="walkthrough-step-icon">
                <MapPin size={18} />
              </div>
              <div className="walkthrough-step-content">
                <div className="walkthrough-step-title">3. Station Anchors &amp; Local Dining</div>
                <p className="walkthrough-step-desc">
                  Discover top-rated Detroit eateries and exclusive rider perks near every stop. Tap <strong>SHOW ON 3D MAP</strong> on any restaurant to spotlight its pin on the 3D grid.
                </p>
              </div>
            </div>

            <div className="walkthrough-step">
              <div className="walkthrough-step-icon">
                <Bell size={18} />
              </div>
              <div className="walkthrough-step-content">
                <div className="walkthrough-step-title">4. Proximity Station Alerts</div>
                <p className="walkthrough-step-desc">
                  Tap <strong>NOTIFY ON ARRIVAL</strong> inside any station card. DPM - Go! will chime and vibrate your device as your train approaches your destination.
                </p>
              </div>
            </div>

            <div className="walkthrough-step">
              <div className="walkthrough-step-icon">
                <Clock3 size={18} />
              </div>
              <div className="walkthrough-step-content">
                <div className="walkthrough-step-title">5. Headways &amp; Scheduled Loop Cadence</div>
                <p className="walkthrough-step-desc">
                  Next-train countdowns follow published headway schedules (every 4–6 mins). Moving trains on the 3D map are simulated to visualize loop cadence.
                </p>
              </div>
            </div>
          </div>

          <div className="walkthrough-footer">
            <label className="walkthrough-opt-out">
              <input
                type="checkbox"
                checked={dontShowWalkthroughAgain}
                onChange={e => setDontShowWalkthroughAgain(e.target.checked)}
              />
              <span>Don't show this guide automatically on startup</span>
            </label>

            <div className="walkthrough-actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dismissWalkthrough(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="hudActive"
                size="sm"
                onClick={() => dismissWalkthrough(true)}
              >
                Got It, Let's Ride!
              </Button>
            </div>
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

function SponsorSlotCard({
  slot,
  place,
  walkMinutes,
  onRestaurant,
  isPinned,
}: {
  slot: StationSlot;
  place: Place;
  walkMinutes: number;
  onRestaurant: (id: string) => void;
  isPinned: boolean;
}) {
  const thumb = getVenueLogo(place);
  return (
    <div className="anchor-spot-wrapper">
      <div className="anchor-spot-eyebrow">
        <span className="anchor-spot-dot" /> SLOT {slot.slot} ·{' '}
        {slot.kind === 'annual' ? 'ANNUAL PARTNER' : `ROTATING PARTNER${slot.rotation ? ` · ${slot.rotation}` : ''}`}
      </div>
      <div className="anchor-spot-box">
        <div className="anchor-spot-top">
          <div className="anchor-spot-thumb">
            {thumb ? <img src={thumb} alt={place.name} loading="lazy" /> : <MapPin size={22} />}
          </div>
          <div className="anchor-spot-info">
            <div className="anchor-spot-name-row">
              <h3 className="anchor-spot-name">{place.name}</h3>
              <span className="anchor-spot-price">{place.price}</span>
            </div>
            <div className="anchor-spot-meta">
              {place.category} · ~{walkMinutes} min walk
            </div>
            <div className="anchor-spot-partner-tag">{slot.tagline}</div>
          </div>
        </div>

        {slot.perk && (
          <div className="anchor-perk-container">
            <div className="anchor-perk-label">RIDER PERK:</div>
            <div className="anchor-perk-body">{slot.perk}</div>
          </div>
        )}

        <div className="anchor-btn-grid">
          <button
            type="button"
            className={`anchor-action-btn ${isPinned ? 'active' : ''}`}
            onClick={() => onRestaurant(place.id)}
          >
            <MapPin size={14} />
            <span>{isPinned ? 'UNTOGGLE 3D PIN' : 'SHOW ON 3D MAP'}</span>
          </button>
          {place.url && (
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor-action-btn anchor-action-visit"
            >
              <span>MENU &amp; VISIT</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function OpenSlotCard({ slot, stationName, stationId }: { slot: 1 | 2; stationName: string; stationId: string }) {
  const annual = slot === 1;
  return (
    <div className="unclaimed-anchor-banner">
      <div>
        <div className="unclaimed-title">
          ★ {annual ? 'CLAIM THE ANNUAL SLOT' : 'CLAIM THE ROTATING SLOT'}
        </div>
        <p className="unclaimed-text">
          {annual
            ? `Lock in the exclusive top spot at ${stationName} for a full year.`
            : `Feature at ${stationName} for one rotation window, then pass it on.`}
        </p>
      </div>
      <a
        href={`/pricing?slot=${slot}&station=${stationId}&name=${encodeURIComponent(stationName)}`}
        className="unclaimed-btn"
      >
        CLAIM SLOT {slot} <ExternalLink size={12} />
      </a>
    </div>
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

  // Slot architecture: slot 1 is the annual partner, slot 2 rotates.
  // Admin assignments from the partner portal override the built-in slots.
  const [assignedSlots, setAssignedSlots] = useState<StationSlot[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/anchor-slots')
      .then(response => (response.ok ? response.json() : { assignments: [] }))
      .then((result: { assignments?: StationSlot[] }) => {
        if (!cancelled) setAssignedSlots(result.assignments ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const slots = useMemo(() => {
    const builtIn = stationSlotAssignments(station.id);
    const override = (slot: 1 | 2): StationSlot | null =>
      assignedSlots.find(item => item.stationId === station.id && item.slot === slot) ?? null;
    return {
      slot1: override(1) ?? builtIn.slot1,
      slot2: override(2) ?? builtIn.slot2,
    };
  }, [station.id, assignedSlots]);

  const slotPlace = (slot: StationSlot | null): Place | null => {
    if (!slot) return null;
    const place = restaurants.find(r => r.id === slot.placeId);
    if (place) return place;
    // Slots assigned from the partner portal can point at a new business.
    return {
      id: slot.placeId,
      name: slot.businessName ?? slot.placeId,
      category: 'Station partner',
      price: '',
      url: '',
      coordinate: station.entrance,
    };
  };
  const slot1Place = slotPlace(slots.slot1);
  const slot2Place = slotPlace(slots.slot2);
  const slotWalkMinutes = (place: Place | null): number => {
    if (!place) return 0;
    return Math.max(1, Math.round(milesBetween(station.entrance, place.coordinate) * 1.25 * 20));
  };

  // Filtered standard listings (slot holders are never listed twice)
  const standardSpots = useMemo(() => {
    const slotIds = new Set([slots.slot1?.placeId, slots.slot2?.placeId].filter(Boolean));
    return allNearby
      .filter(r => !slotIds.has(r.id))
      .filter(r => {
        if (priceFilter === '$' && r.price !== '$') return false;
        if (priceFilter === '$$' && r.price !== '$$') return false;
        if (priceFilter === '$$$+' && r.price !== '$$$' && r.price !== '$$$$') return false;
        if (maxMinutes !== 'all' && r.walkMinutes > maxMinutes) return false;
        if (lateNightOnly && !r.lateNight) return false;
        return true;
      });
  }, [allNearby, slots, priceFilter, maxMinutes, lateNightOnly]);

  const stationsInLine = isQLine ? qlineStations : peopleMoverStations;
  const number = stationsInLine.findIndex(s => s.id === station.id) + 1;
  const next = stationsInLine[number % stationsInLine.length] ?? station;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${station.entrance[1]},${station.entrance[0]}`;

  // Garages that connect to this station for a park-once trip.
  const stationParking = useMemo(
    () =>
      nearbyParking(station).map(garage => ({
        ...garage,
        walkMinutes: Math.max(1, Math.round(garage.walkMiles * 20)),
      })),
    [station]
  );

  // Walk estimate from downtown center (Campus Martius [-83.0466, 42.3316])
  const walkingMiles = milesBetween([-83.0466, 42.3316], station.entrance) * 1.3;
  const walkingMinutes = Math.max(1, Math.round(walkingMiles * 20));

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const sched = stationSchedule(station.id, now);
  const qline = useMemo(() => qlineStatus(now), [now]);
  const qlineDepartures = useMemo(
    () => (isQLine ? qlineStationSchedule(station.id, now) : []),
    [isQLine, station.id, now]
  );

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
          <div
            className={`stat-tri-status ${(isQLine ? qline.running : sched.running) ? 'is-running' : 'not-running'}`}
          >
            {isQLine
              ? qline.running
                ? 'Running'
                : 'Not running'
              : sched.running
                ? 'Running'
                : 'Not running'}
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
          qlineDepartures.length > 0 ? (
            <div className="timetable-rows">
              {qlineDepartures.map((departure, index) => (
                <div key={`${departure.seconds}-${index}`} className="timetable-row">
                  <div className="timetable-clock-box">
                    <Clock3 size={18} />
                  </div>
                  <div className="timetable-time-col">
                    <div className="timetable-primary-time">{departure.time}</div>
                    <div className="timetable-day-note">
                      {departure.minutes <= 0
                        ? 'Due at platform'
                        : departure.minutes <= 15
                          ? `In ~${departure.minutes} min \u00b7 ${departure.label}`
                          : departure.label}
                    </div>
                  </div>
                  {departure.minutes > 0 && departure.minutes <= 10 && (
                    <span className="timetable-pill-due">APPROACHING</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="timetable-rows">
              <div className="timetable-row">
                <div className="timetable-clock-box">
                  <Clock3 size={18} />
                </div>
                <div className="timetable-time-col">
                  <div className="timetable-primary-time">
                    {qline.running ? `Every ${QLINE_HEADWAY_MINUTES} Min` : 'Service Closed'}
                  </div>
                  <div className="timetable-day-note">
                    {qline.running
                      ? qline.nextDepartureLabel
                      : `${qline.nextDepartureLabel} \u00b7 ${qline.window.opensAt} to ${qline.window.closesAt}`}
                  </div>
                </div>
                <div className="timetable-status-tag">{qline.running ? 'ACTIVE' : 'CLOSED'}</div>
              </div>
              <div className="timetable-row">
                <div className="timetable-clock-box">
                  <Clock3 size={18} />
                </div>
                <div className="timetable-time-col">
                  <div className="timetable-primary-time">
                    {qline.window.opensAt} to {qline.window.closesAt}
                  </div>
                  <div className="timetable-day-note">
                    {qline.window.isSunday ? 'Sunday service hours' : 'Monday to Saturday service hours'}
                    {qline.window.fromFeed ? ' \u00b7 agency GTFS' : ' \u00b7 published hours'}
                  </div>
                </div>
                <div className="timetable-status-tag">FREE</div>
              </div>
            </div>
          )
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

        {/* Slot 1 — annual partner */}
        {slot1Place && slots.slot1 ? (
          <SponsorSlotCard
            slot={slots.slot1}
            place={slot1Place}
            walkMinutes={slotWalkMinutes(slot1Place)}
            onRestaurant={onRestaurant}
            isPinned={restaurantId === slot1Place.id}
          />
        ) : (
          <OpenSlotCard slot={1} stationName={station.name} stationId={station.id} />
        )}

        {/* Slot 2 — rotating partner */}
        {slot2Place && slots.slot2 ? (
          <SponsorSlotCard
            slot={slots.slot2}
            place={slot2Place}
            walkMinutes={slotWalkMinutes(slot2Place)}
            onRestaurant={onRestaurant}
            isPinned={restaurantId === slot2Place.id}
          />
        ) : (
          <OpenSlotCard slot={2} stationName={station.name} stationId={station.id} />
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
                  {getVenueLogo(r) ? (
                    <img src={getVenueLogo(r) ?? ''} alt={r.name} loading="lazy" />
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

        {/* Park once garages connected to this station */}
        {stationParking.length > 0 && (
          <div className="dining-block">
            <div className="dining-section-header">
              <span className="dining-section-title">PARK ONCE · NEARBY GARAGES</span>
            </div>
            <div className="restaurants-scroll-list">
              {stationParking.map(garage => (
                <div key={garage.id} className="restaurant-row-card">
                  <div className="restaurant-thumb-box">
                    <SquareParking size={18} />
                  </div>
                  <div className="restaurant-info-box">
                    <div className="restaurant-name-header">
                      <span className="restaurant-name">{garage.name}</span>
                    </div>
                    <div className="restaurant-meta-line">
                      {garage.address} · ~{garage.walkMinutes} min walk · {garage.line === 'mover' ? 'DPM' : 'QLINE'}
                    </div>
                    <div className="restaurant-meta-line">{garage.hours}</div>
                  </div>
                  <div className="restaurant-actions-box">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${garage.coordinate[1]},${garage.coordinate[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="restaurant-external-link"
                      aria-label={`Open ${garage.name} in maps`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="restaurant-meta-line" style={{ marginTop: '0.5rem' }}>
              Rates and hours vary — confirm with the garage on arrival.
            </div>
          </div>
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