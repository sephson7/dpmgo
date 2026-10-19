import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Mail, ShieldCheck, Sparkles, ArrowRight, Building, MapPin, Send, Tag } from 'lucide-react';
import { peopleMoverStations, qlineStations } from '../data/transit';

export const Route = createFileRoute('/pricing')({
  head: () => ({
    meta: [
      { title: 'Station Anchor Partnership | DPM - Go!' },
      { name: 'description', content: 'Claim exclusive station anchor sponsorship on Detroit’s DPM - Go! 3D transit HUD.' },
      { property: 'og:title', content: 'Station Anchor Partnership | DPM - Go!' },
      { property: 'og:description', content: 'Claim exclusive station anchor sponsorship on Detroit’s DPM - Go! 3D transit HUD.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [stationId, setStationId] = useState('');
  const [stationName, setStationName] = useState('');

  // Merchant intake state
  const [businessName, setBusinessName] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [perkOffer, setPerkOffer] = useState('');
  const [intakeDone, setIntakeDone] = useState(false);

  const stripeContainerRef = useRef<HTMLDivElement>(null);

  // Ensure document and body scroll freely on mobile devices for checkout
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    const prevRootOverflow = root.style.overflowY;
    const prevRootHeight = root.style.height;
    const prevBodyOverflow = body.style.overflowY;
    const prevBodyHeight = body.style.height;
    const prevBodyTouch = body.style.touchAction;

    root.style.overflowY = 'auto';
    root.style.height = 'auto';
    body.style.overflowY = 'auto';
    body.style.height = 'auto';
    body.style.touchAction = 'auto';

    return () => {
      root.style.overflowY = prevRootOverflow;
      root.style.height = prevRootHeight;
      body.style.overflowY = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      body.style.touchAction = prevBodyTouch;
    };
  }, []);

  // Check URL parameters for station attribution and Stripe redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('station');
      const sname = params.get('name');
      if (sid) setStationId(sid);
      if (sname) setStationName(sname);

      if (params.get('success') === 'true' || params.has('session_id')) {
        setIsSuccess(true);
      }
    }
  }, []);

  // Dynamically load Stripe's pricing table
  useEffect(() => {
    if (isSuccess) return;

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    const container = stripeContainerRef.current;
    if (container) {
      container.innerHTML = '';
      const table = document.createElement('stripe-pricing-table');
      table.setAttribute('pricing-table-id', 'prctbl_1UQ9Ky57MO63Hzo12cFECrWf');
      table.setAttribute(
        'publishable-key',
        'pk_live_51UQ8Q957MO63Hzo1kKCL8z2xUtv75B87HNnp6Hd99EPMYlltLeUMNuCYUd1HhCoeFQT7G3irEuFkU7GiPedJ5Sek00Q16TKFlW'
      );
      container.appendChild(table);
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isSuccess]);

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittedEmail && businessName) {
      setIntakeDone(true);
    }
  };

  const allStations = [...peopleMoverStations, ...qlineStations];

  return (
    <div className="pricing-page min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-between p-4 sm:p-6 font-sans w-full overflow-y-auto">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between pb-6 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            DPM
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-cyan-400">DPM - Go!</h1>
            <p className="text-xs text-slate-400 tracking-wide">MOTORCITY AUTOMATED SYSTEMS</p>
          </div>
        </div>
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wider hover:bg-cyan-900/80 transition-colors"
        >
          ← BACK TO MAP
        </a>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl my-auto py-8 flex flex-col items-center">
        {isSuccess ? (
          /* Post-Checkout Onboarding Confirmation Card */
          <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 border border-cyan-500/40 backdrop-blur-xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-400 mb-5">
              <CheckCircle2 size={36} />
            </div>
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              Partner Order Received
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 mb-2">
              Station Anchor Secured
            </h2>

            {stationName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 text-xs font-mono mb-4">
                <MapPin size={12} /> Station: <strong>{stationName}</strong>
              </div>
            )}

            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 my-4 text-left flex items-start gap-3">
              <Clock size={20} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cyan-200">
                  Your station anchor slot is now in review and will activate within 24 hours.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  We are preparing your custom 3D map pin and dedicated rider perk banner.
                </p>
              </div>
            </div>

            {/* Structured Partner Intake Form */}
            {!intakeDone ? (
              <form onSubmit={handleIntakeSubmit} className="mt-5 text-left space-y-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Business / Restaurant Name:
                  </label>
                  <div className="relative">
                    <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Lafayette Coney Island"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Manager Contact Email:
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={submittedEmail}
                      onChange={e => setSubmittedEmail(e.target.value)}
                      placeholder="manager@yourbusiness.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Exclusive Rider Perk (Optional):
                  </label>
                  <div className="relative">
                    <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={perkOffer}
                      onChange={e => setPerkOffer(e.target.value)}
                      placeholder="e.g. 15% off with People Mover ride proof"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send size={13} /> Complete Partner Intake
                </button>
              </form>
            ) : (
              <div className="text-sm text-emerald-400 font-medium py-3 border border-emerald-500/30 rounded-lg bg-emerald-950/20 my-4">
                ✓ Intake received! Check your inbox shortly for asset confirmation.
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-cyan-400" /> Stripe Verified
              </span>
              <a href="/" className="text-cyan-400 hover:underline flex items-center gap-1">
                Return to Detroit Map <ArrowRight size={12} />
              </a>
            </div>
          </div>
        ) : (
          /* Standard Pricing Table View */
          <>
            <div className="text-center mb-6 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono tracking-wider text-cyan-300 uppercase mb-3">
                <Sparkles size={12} /> Downtown Commercial Program
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                Station Anchor Partnership
              </h2>
              <p className="text-gray-400 text-sm">
                Secure top-tier prominence on Detroit's dedicated 3D transit HUD.
              </p>
            </div>

            {/* Target Station Attribution Badge / Selector */}
            {stationName ? (
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-xs font-mono tracking-wider">
                <MapPin size={14} className="text-cyan-400" />
                CLAIMING EXCLUSIVE ANCHOR FOR: <strong className="text-white uppercase">{stationName}</strong>
              </div>
            ) : (
              <div className="w-full max-w-md mb-6">
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1 text-left">
                  Optional: Select Target Station
                </label>
                <select
                  value={stationId}
                  onChange={e => {
                    const sel = allStations.find(s => s.id === e.target.value);
                    setStationId(e.target.value);
                    setStationName(sel ? sel.name : '');
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-cyan-500/40 text-sm text-cyan-200 focus:outline-none"
                >
                  <option value="">Choose a Detroit Station...</option>
                  <optgroup label="People Mover (13 Stations)">
                    {peopleMoverStations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="QLINE (12 Stations)">
                    {qlineStations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Activation Notice */}
            <div className="w-full max-w-3xl mb-6 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 flex items-center gap-3">
              <Clock size={18} className="text-cyan-400 shrink-0" />
              <p className="text-xs md:text-sm text-cyan-100">
                <strong className="text-cyan-300">Activation Timeline:</strong> Upon checkout, our team reviews and activates your station anchor placement within 24 hours.
              </p>
            </div>

            {/* Stripe Pricing Table */}
            <div className="w-full rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl p-3 sm:p-6 shadow-2xl overflow-x-auto">
              <div ref={stripeContainerRef} className="w-full min-w-[280px] flex justify-center" />
            </div>
          </>
        )}
      </main>

      {/* Footer Compliance Stamp */}
      <footer className="w-full max-w-4xl pt-6 border-t border-cyan-500/20 text-center text-[10px] text-slate-400 font-mono tracking-wider flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>MOTORCITY AUTOMATED SYSTEMS · DPM - Go!</span>
        <span>Building Targeted Autonomous Solutions for Detroit</span>
      </footer>
    </div>
  );
}
