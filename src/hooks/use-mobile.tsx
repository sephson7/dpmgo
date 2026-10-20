import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
// The same breakpoint the layout stylesheet uses, so the rendered layout and
// the CSS always agree.
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;

function subscribe(onChange: () => void) {
  const list = window.matchMedia(MOBILE_QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * True on a phone sized viewport. The server renders the desktop layout and
 * the client switches right after hydration, which the launch screen covers.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
