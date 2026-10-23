import logo from '@/assets/dpm-go-logo-clean.png.asset.json';

/** The launch screen that covers the map while it initialises. */
export default function WakeScreen() {
  return (
    <div className="wake-screen" aria-hidden="true">
      <div className="wake-content">
        <img src={logo.url} alt="DPM - Go! logo" className="wake-logo" />
      </div>
    </div>
  );
}
