import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import HomeHud from '@/components/HomeHud';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'DPM - Go! | Detroit Transit Map' },
      {
        name: 'description',
        content:
          'Explore Detroit People Mover stations and the QLINE corridor on an interactive downtown map.',
      },
      { property: 'og:title', content: 'DPM - Go! | Detroit Transit Map' },
      {
        property: 'og:description',
        content:
          'Explore Detroit People Mover stations and the QLINE corridor on an interactive downtown map.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: HomeRoute,
});

/**
 * Registers the offline service worker.
 *
 * The worker caches the app shell, the stylesheets, the station datasets and
 * the icons, so the map keeps working when a rider loses cell service. It is
 * only registered in a production build: in development it would hold on to
 * the previous build's assets.
 */
function HomeRoute() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {
          // Offline support is a bonus, so a failed registration is not fatal.
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }

    // The chunks the app imports lazily, such as the map, are only known
    // after the app has run, so the page reports what it loaded and the
    // worker caches it for the next offline visit.
    const seen = new Set<string>();
    const pending = new Set<string>();
    const ready = navigator.serviceWorker.ready;

    const flush = async () => {
      if (!pending.size) return;
      try {
        const registration = await ready;
        const worker = navigator.serviceWorker.controller ?? registration.active;
        // The worker is not up yet: keep the list and try again later.
        if (!worker) return;
        const urls = [...pending];
        worker.postMessage({ type: 'CACHE_URLS', urls });
        urls.forEach((url) => {
          pending.delete(url);
          seen.add(url);
        });
      } catch {
        // The worker never came up; the app works without it.
      }
    };

    const report = (names: string[]) => {
      for (const name of names) {
        if (name.startsWith(window.location.origin) && !seen.has(name)) pending.add(name);
      }
      void flush();
    };

    const observer = new PerformanceObserver((list) => {
      report(list.getEntries().map((entry) => entry.name));
    });
    try {
      observer.observe({ type: 'resource', buffered: true });
    } catch {
      // Without resource timing the worker still caches the shell.
    }
    void flush();

    return () => {
      observer.disconnect();
      window.removeEventListener('load', register);
    };
  }, []);

  return <HomeHud />;
}
