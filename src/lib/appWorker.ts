/** Only our old app-shell worker may be retired; messaging workers are unrelated. */
export function isAppWorker(scriptURL: string, origin: string): boolean {
  const url = new URL(scriptURL, origin);
  return url.origin === origin && ['/sw.js', '/service-worker.js'].includes(url.pathname);
}

export function refusesAppWorker(
  production: boolean,
  hostname: string,
  framed: boolean,
  search: string,
): boolean {
  const host = hostname.toLowerCase();
  if (!production || framed || new URLSearchParams(search).get('sw') === 'off') return true;
  if (
    ['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'].some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    )
  ) return true;
  const labels = host.split('.');
  const domain = labels.slice(-2).join('.');
  return (
    ['lovable.app', 'gpt-eng.com', 'gptengineer.run'].includes(domain) &&
    (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(labels[0]) ||
      /^project--.+-dev$/.test(labels[0]))
  );
}

/** One-release cleanup: returning visitors receive the replacement at the old URL. */
export async function retireAppWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  const appRegistrations = registrations.filter((registration) => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    return worker && isAppWorker(worker.scriptURL, window.location.origin);
  });
  if (
    refusesAppWorker(
      import.meta.env.PROD,
      window.location.hostname,
      window.self !== window.top,
      window.location.search,
    )
  ) {
    await Promise.all(appRegistrations.map((registration) => registration.unregister()));
    return;
  }
  // Do not install anything for new visitors. Existing devices need the same-path
  // replacement because deleting the old worker would leave their caches intact.
  await Promise.all(
    appRegistrations.map((registration) => {
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (!worker) return Promise.resolve();
      return navigator.serviceWorker.register(worker.scriptURL, {
        scope: registration.scope,
        updateViaCache: 'none',
      });
    }),
  );
}