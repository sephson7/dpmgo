import { useState, useEffect, useCallback, useRef } from 'react';
import type { Station } from '@/data/transit';
import { milesBetween } from '@/data/transit';

export function useStationAlert() {
  const [targetStation, setTargetStation] = useState<Station | null>(null);
  const [distanceMiles, setDistanceMiles] = useState<number | null>(null);
  const [hasAlerted, setHasAlerted] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const triggerAlert = useCallback((stationName: string) => {
    // Device haptic vibration
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
    // Web audio bell chime fallback
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // AudioContext unavailable
    }
  }, []);

  const armAlert = useCallback((station: Station) => {
    setTargetStation(station);
    setHasAlerted(false);
    setGpsError(null);
  }, []);

  const cancelAlert = useCallback(() => {
    setTargetStation(null);
    setDistanceMiles(null);
    setHasAlerted(false);
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!targetStation || typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const userCoord: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        const dist = milesBetween(userCoord, targetStation.coordinate);
        setDistanceMiles(dist);

        // Alert threshold: ~0.2 miles (~320 meters / 1 stop ahead)
        if (dist <= 0.22 && !hasAlerted) {
          setHasAlerted(true);
          triggerAlert(targetStation.name);
        }
      },
      (err) => {
        setGpsError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [targetStation, hasAlerted, triggerAlert]);

  return { targetStation, distanceMiles, hasAlerted, gpsError, armAlert, cancelAlert };
}
