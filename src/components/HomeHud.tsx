import { useEffect, useMemo, useRef, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import {
  allTransitStations,
  calculateFlexibleRoute,
  canadaTransitGuide,
  destinationShortcuts,
  howDoIFlows,
  milesBetween,
  peopleMoverStations,
  popularHotels,
  qlineStations,
  type DestinationShortcut,
  type HowDoIFlow,
  type Station,
} from '@/data/transit';
import { stationSchedule, type StationSchedule } from '@/data/schedule';
import { qlineServiceRunning, qlineStationSchedule, qlineStatus } from '@/data/qlineSchedule';
import { moverDrawerArrivals } from '@/data/moverDrawerArrivals';
import {
  canOfferRiderFeedback,
  RIDER_FEEDBACK_SESSION_KEY,
  type RiderFeedbackContext,
} from '@/data/riderFeedback';
import { useStationAlert } from '@/hooks/useStationAlert';
import { useIsMobile } from '@/hooks/use-mobile';
import { localNearestStation } from '@/data/nearestStation';

import AlarmBanner from '@/components/hud/AlarmBanner';
import ComplianceFooter from '@/components/hud/ComplianceFooter';
import HeadlineArea from '@/components/hud/HeadlineArea';
import HomeStrip from '@/components/hud/HomeStrip';
import MapChrome from '@/components/hud/MapChrome';
import MapStage from '@/components/hud/MapStage';
import QuickRoutesBar from '@/components/hud/QuickRoutesBar';
import QuickRoutesMenu from '@/components/hud/QuickRoutesMenu';
import StationDirectoryPanel from '@/components/hud/StationDirectoryPanel';
import StationLauncher from '@/components/hud/StationLauncher';
import StatusStrip from '@/components/hud/StatusStrip';
import TopBar from '@/components/hud/TopBar';
import WakeScreen from '@/components/hud/WakeScreen';
import InfoPanel from '@/components/drawers/InfoPanel';
import StationDirectoryDrawer from '@/components/drawers/StationDirectoryDrawer';
import StationDrawer from '@/components/drawers/StationDrawer';
import LegalDialog, { type LegalDocument } from '@/components/dialogs/LegalDialog';
import QuickNavDialog from '@/components/dialogs/QuickNavDialog';
import WalkthroughDialog from '@/components/dialogs/WalkthroughDialog';
import RiderFeedbackDialog from '@/components/dialogs/RiderFeedbackDialog';

export default function HomeHud() {
  // The phone and the desktop render different layouts, so the phone never
  // pays for the desktop directory behind the map.
  const isPhone = useIsMobile();

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
  const [selectedHotel, setSelectedHotel] = useState(popularHotels[0]!);
  const [manualOriginId, setManualOriginId] = useState<string | null>(null);

  const [isBoarded, setIsBoarded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackPrompted, setFeedbackPrompted] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState<RiderFeedbackContext | null>(null);
  const preBoardingEstimate = useRef<RiderFeedbackContext | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [autoNearestId, setAutoNearestId] = useState<string | null>(null);
  const autoSnapAttempted = useRef(false);
  const manuallyNavigated = useRef(false);

  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [dontShowWalkthroughAgain, setDontShowWalkthroughAgain] = useState(true);

  const [panel, setPanel] = useState<null | 'activities' | string>(null);
  const [legal, setLegal] = useState<LegalDocument | null>(null);
  const [waking, setWaking] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const alertSystem = useStationAlert();

  // Compute target destination object for flexible routing
  const activeTargetDestination = useMemo(() => {
    if (activeShortcut) return activeShortcut;
    if (activeHowDoI?.id === 'hotel') return selectedHotel;
    if (activeHowDoI?.id === 'canada') return canadaTransitGuide;
    if (activeHowDoI?.id === 'campus-martius') {
      return (
        destinationShortcuts.find((d) => d.id === 'campus-martius') || destinationShortcuts[4]!
      );
    }
    if (activeHowDoI?.id === 'riverfront') {
      return destinationShortcuts.find((d) => d.id === 'hart-plaza') || destinationShortcuts[5]!;
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
        }),
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
      const target = destinationShortcuts.find((d) => d.id === 'campus-martius')!;
      handleFlyToTarget(target.name, target.coordinate);
    } else if (flow.id === 'riverfront') {
      const target = destinationShortcuts.find((d) => d.id === 'hart-plaza')!;
      handleFlyToTarget(target.name, target.coordinate);
    }
  };

  // Reset the map: drop every marked location (the quick route pin, the
  // restaurant pin and the selected station) and fly back to the default
  // downtown overview.
  const handleResetMap = () => {
    manuallyNavigated.current = true;
    setAutoNearestId(null);
    setRestaurantId(null);
    setSelectedId(null);
    setActiveShortcut(null);
    setActiveHowDoI(null);
    setQuickNavOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dpm-map-reset'));
    }
  };

  // GPS watcher: the rider position is tracked the whole time so the boarding
  // station can be detected automatically and the map can lock onto the rider.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    let cancelled = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        setUserPos([pos.coords.longitude, pos.coords.latitude]);
        setGpsError(null);
      },
      (err) => {
        if (cancelled) return;
        // A denied or unavailable GPS must never break the map.
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied'
            : 'Location unavailable',
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Any rider interaction takes precedence over the automatic first-location frame.
  useEffect(() => {
    const markManual = () => {
      manuallyNavigated.current = true;
    };
    document.addEventListener('pointerdown', markManual, { capture: true, once: true });
    document.addEventListener('keydown', markManual, { capture: true, once: true });
    return () => {
      document.removeEventListener('pointerdown', markManual, true);
      document.removeEventListener('keydown', markManual, true);
    };
  }, []);

  const toggleRestaurant = (id: string) => {
    setRestaurantId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    let timer: number | undefined;
    try {
      const seen =
        typeof window !== 'undefined' ? localStorage.getItem('dpmgo_walkthrough_seen') : null;
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
      } catch {
        // Ignore storage errors in restricted contexts
      }
    }
  };

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

  const selected = allTransitStations.find((station) => station.id === selectedId) ?? null;

  useEffect(() => {
    if (!userPos || !mapReady || autoSnapAttempted.current) return;
    autoSnapAttempted.current = true;
    if (manuallyNavigated.current || selectedId || activeShortcut || activeHowDoI || followUser)
      return;
    const station = localNearestStation(userPos, activeStations);
    if (!station) return;
    setAutoNearestId(station.id);
    window.dispatchEvent(
      new CustomEvent('dpm-map-flyto', {
        detail: {
          center: station.coordinate,
          zoom: 16,
          pitch: 50,
          bearing: -20,
          targetName: `Nearest station · ${station.name}`,
        },
      }),
    );
  }, [userPos, mapReady, selectedId, activeShortcut, activeHowDoI, followUser, activeStations]);

  // Announce the selected stop for screen reader users. The map pins are
  // drawn on a canvas, so the station directory is the accessible route.
  const announcement = useMemo(() => {
    if (!selected) return '';
    const line = selected.line === 'qline' ? 'QLINE streetcar' : 'People Mover';
    const lineStations = selected.line === 'qline' ? qlineStations : peopleMoverStations;
    const index = lineStations.findIndex((station) => station.id === selected.id);
    const next = lineStations[(index + 1) % lineStations.length];
    return `${selected.name} selected on the ${line}. Next stop ${next?.name ?? 'unknown'}.`;
  }, [selected]);
  const filtered = activeStations.filter((station) =>
    station.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Active station for hero countdown ticker
  const nearestStation = useMemo(() => {
    if (!userPos) return activeStations[0] as Station;
    const sorted = [...activeStations].sort(
      (a, b) => milesBetween(userPos, a.coordinate) - milesBetween(userPos, b.coordinate),
    );
    return (sorted[0] as Station) ?? (activeStations[0] as Station);
  }, [userPos, activeStations]);

  const tickerStation = selected ?? nearestStation;
  useEffect(() => {
    if (isBoarded) return;
    const arrival =
      tickerStation.line === 'qline' ? null : moverDrawerArrivals(tickerStation.id, now)[0];
    preBoardingEstimate.current =
      arrival?.source === 'simulation'
        ? {
            stationId: tickerStation.id,
            stationName: tickerStation.name,
            predictedMinutes: arrival.minutes,
            predictionAt: now.toISOString(),
          }
        : null;
  }, [isBoarded, tickerStation, now]);
  const handleToggleBoarded = () => {
    const boarding = !isBoarded;
    setIsBoarded(boarding);
    let alreadyPrompted = feedbackPrompted;
    try {
      alreadyPrompted ||= sessionStorage.getItem(RIDER_FEEDBACK_SESSION_KEY) === 'true';
    } catch {
      /* In-memory guard still works if storage is blocked. */
    }
    const context = preBoardingEstimate.current;
    if (!canOfferRiderFeedback(boarding, alreadyPrompted, context)) return;
    setFeedbackPrompted(true);
    try {
      sessionStorage.setItem(RIDER_FEEDBACK_SESSION_KEY, 'true');
    } catch {
      /* Guard remains in memory. */
    }
    setFeedbackContext(context);
    setFeedbackOpen(true);
  };
  const tickerSchedule = useMemo<StationSchedule>(() => {
    if (tickerStation.line !== 'qline') return stationSchedule(tickerStation.id, now);
    // QLINE stations follow the QLINE timetable and published hours, not the People Mover feed.
    const running = qlineServiceRunning(now);
    const trains = qlineStationSchedule(tickerStation.id, now).map((d) => ({
      time: d.time,
      minutes: d.minutes,
      day: null,
    }));
    if (!running && trains.length === 0) {
      const status = qlineStatus(now);
      if (status.minutesToNext !== null) {
        const opensAt = status.nextDepartureLabel.replace(/^OPENS /, '');
        trains.push({ time: opensAt, minutes: status.minutesToNext, day: null });
      }
    }
    return { running, trains, specialToday: false, specialDays: [] };
  }, [tickerStation.id, tickerStation.line, now]);

  useEffect(() => {
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1450;
    const timer = window.setTimeout(() => setWaking(false), delay);
    return () => window.clearTimeout(timer);
  }, []);

  const openStation = (id: string) => {
    manuallyNavigated.current = true;
    setAutoNearestId(null);
    setRestaurantId(null);
    if (stationListOpen) {
      setStationListOpen(false);
      window.setTimeout(() => setSelectedId(id), 320);
    } else {
      setSelectedId(id);
    }
  };

  // The home strip opens the station it refers to, and a partner item lands
  // straight on the sponsor card.
  const [focusPartner, setFocusPartner] = useState(false);
  const openStationFromStrip = (stationId: string, partner: boolean) => {
    setRestaurantId(null);
    setFocusPartner(partner);
    setSelectedId(stationId);
  };

  const toggleLayer = (layer: 'peopleMover' | 'qline' | 'parking') => {
    if (layer === 'peopleMover') {
      // Ensure at least one route is visible
      if (peopleMover && !qline) {
        setQline(true);
        setPeopleMover(false);
      } else {
        setPeopleMover((v) => !v);
      }
      return;
    }
    if (layer === 'qline') {
      // Ensure at least one route is visible
      if (qline && !peopleMover) {
        setPeopleMover(true);
        setQline(false);
      } else {
        setQline((v) => !v);
      }
      return;
    }
    setParking((v) => !v);
  };

  const quickRouteState = { activeShortcut, activeHowDoI };
  const quickRouteActions = {
    onOpenDestination: openDestinationShortcut,
    onOpenHowDoI: openHowDoIFlow,
  };
  const ticker = {
    station: tickerStation,
    schedule: tickerSchedule,
  };
  const layers = { peopleMover, qline, parking };

  return (
    <main className="app-shell">
      <MapStage
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

      <div className="interface-shell">
        <a
          className="skip-link"
          href={isPhone ? '#station-directory-launcher' : '#station-directory'}
        >
          Skip to the station directory
        </a>
        <p className="sr-only" role="status" aria-live="polite">
          {announcement}
        </p>

        <TopBar
          onSelectPanel={setPanel}
          onOpenStationDirectory={() => setStationListOpen(true)}
          quickRoutes={
            isPhone ? <QuickRoutesMenu {...quickRouteState} {...quickRouteActions} /> : null
          }
        />

        {!isPhone && <QuickRoutesBar {...quickRouteState} {...quickRouteActions} />}

        <AlarmBanner
          target={alertSystem.targetStation}
          triggered={alertSystem.hasAlerted}
          distanceMiles={alertSystem.distanceMiles}
          onCancel={alertSystem.cancelAlert}
        />

        <HeadlineArea
          strip={
            isPhone ? (
              <HomeStrip
                variant="pill"
                station={tickerStation}
                schedule={tickerSchedule}
                onOpenStation={openStationFromStrip}
              />
            ) : null
          }
          layers={layers}
          isBoarded={isBoarded}
          onToggleBoarded={handleToggleBoarded}
          followUser={followUser}
          onToggleFollow={() => setFollowUser((v) => !v)}
          hasUserPosition={Boolean(userPos)}
          gpsError={gpsError}
          onToggleLayer={toggleLayer}
        />

        {!isPhone && (
          <StationDirectoryPanel
            stations={activeStations}
            filtered={filtered}
            selectedId={selectedId ?? autoNearestId}
            onSelect={openStation}
            search={search}
            onSearch={setSearch}
            layers={layers}
            onFlyTo={handleFlyToTarget}
            ticker={ticker}
            onOpenStation={openStationFromStrip}
            stationSelected={Boolean(selected)}
          />
        )}

        <MapChrome parking={parking} onReset={handleResetMap} />

        {/* The bottom dock: the station launcher, the status line and the
            compliance footer. The installed app turns it into one glass
            panel and floats the launcher over the map. */}
        <div className="bottom-dock">
          {isPhone && <StationLauncher onOpen={() => setStationListOpen(true)} />}

          <StatusStrip mapReady={mapReady} />

          <ComplianceFooter onOpenLegal={setLegal} onOpenGuide={() => setWalkthroughOpen(true)} />
        </div>
      </div>

      {/* Station Drawer with Dining & Anchor Partner Logic */}
      <Drawer open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DrawerContent className="drawer-shell detail-drawer">
          {selected && (
            <StationDrawer
              station={selected}
              restaurantId={restaurantId}
              onRestaurant={toggleRestaurant}
              isArmed={alertSystem.targetStation?.id === selected.id}
              onArm={() => alertSystem.armAlert(selected)}
              onDisarm={alertSystem.cancelAlert}
              focusPartner={focusPartner}
            />
          )}
        </DrawerContent>
      </Drawer>

      <StationDirectoryDrawer
        open={stationListOpen}
        onOpenChange={setStationListOpen}
        stations={activeStations}
        filtered={filtered}
        selectedId={selectedId ?? autoNearestId}
        onSelect={openStation}
        search={search}
        onSearch={setSearch}
      />

      <Drawer open={Boolean(panel)} onOpenChange={(open) => !open && setPanel(null)}>
        <DrawerContent className="drawer-shell detail-drawer">
          <InfoPanel panel={panel} />
        </DrawerContent>
      </Drawer>

      <LegalDialog document={legal} onOpenChange={(open) => !open && setLegal(null)} />

      {/* QUICK NAVIGATION & FLEXIBLE BOARDING DIALOG */}
      <QuickNavDialog
        open={quickNavOpen}
        onOpenChange={setQuickNavOpen}
        activeShortcut={activeShortcut}
        activeHowDoI={activeHowDoI}
        route={flexibleRoute}
        selectedHotel={selectedHotel}
        onSelectHotel={(hotel) => {
          setSelectedHotel(hotel);
          handleFlyToTarget(hotel.name, hotel.coordinate);
        }}
        userPosition={userPos}
        manualOriginId={manualOriginId}
        onSelectOrigin={setManualOriginId}
        onArmAlarm={() => {
          alertSystem.armAlert(flexibleRoute.destinationStation);
          setQuickNavOpen(false);
        }}
        onFlyToDestination={() => {
          handleFlyToTarget(flexibleRoute.destinationHubName, flexibleRoute.targetCoordinate);
          setQuickNavOpen(false);
        }}
      />

      {/* Walkthrough & Onboarding Guide Dialog */}
      <RiderFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        context={feedbackContext}
      />
      <WalkthroughDialog
        open={walkthroughOpen}
        onDismiss={dismissWalkthrough}
        dontShowAgain={dontShowWalkthroughAgain}
        onDontShowAgainChange={setDontShowWalkthroughAgain}
      />

      {waking && <WakeScreen />}
    </main>
  );
}
