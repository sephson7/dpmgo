import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import { findStation, peopleMoverStations, qlineStations } from '../data/transit';
import { plansAllowedForSlot, type AnchorPlan } from '../lib/stripe';

/**
 * The partner checkout.
 *
 * A merchant scans the QR code on a sales flyer and lands here. They pick the
 * station and the anchor slot, tell us who they are, and pay. The details are
 * collected before the payment because the confirmation email goes out the
 * moment Stripe confirms the session, and it needs a recipient.
 */
export const Route = createFileRoute('/partner')({
  head: () => ({
    meta: [
      { title: 'Station Anchor Partnership | DPM - Go!' },
      {
        name: 'description',
        content:
          'Claim exclusive station anchor sponsorship on Detroit’s DPM - Go! 3D transit HUD.',
      },
      { property: 'og:title', content: 'Station Anchor Partnership | DPM - Go!' },
      {
        property: 'og:description',
        content:
          'Claim exclusive station anchor sponsorship on Detroit’s DPM - Go! 3D transit HUD.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: PartnerPage,
});

type CheckoutState = 'idle' | 'verifying' | 'paid' | 'failed';

type AnchorAssignment = {
  stationId: string;
  slot: 1 | 2;
  businessName: string;
};

type Verification = {
  paid: boolean;
  sessionId?: string;
  slot?: 1 | 2 | null;
  plan?: AnchorPlan | null;
  slotPlanAllowed?: boolean;
  receipt?: string | null;
  emailed?: boolean;
  email?: string | null;
  confirmationError?: string | null;
};

const PLAN_PRICES: Record<AnchorPlan, string> = {
  monthly: '$375 / MONTH',
  annual: '$1,875 / YEAR',
};

const inputClass =
  'w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400';
const labelClass = 'block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1';

function PartnerPage() {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [stationId, setStationId] = useState('');
  const [stationName, setStationName] = useState('');
  const [slot, setSlot] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<AnchorPlan>('annual');
  const [canceled, setCanceled] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [verified, setVerified] = useState<Verification | null>(null);

  // The merchant details. They are collected before the payment because the
  // confirmation email is sent as soon as Stripe confirms the session.
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [perkOffer, setPerkOffer] = useState('');
  const [assignments, setAssignments] = useState<AnchorAssignment[]>([]);

  const isSuccess = checkoutState === 'paid';
  const allStations = useMemo(() => [...peopleMoverStations, ...qlineStations], []);

  // Let the page scroll freely on a phone, the way the checkout needs.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const previous = {
      rootOverflow: root.style.overflowY,
      rootHeight: root.style.height,
      bodyOverflow: body.style.overflowY,
      bodyHeight: body.style.height,
      bodyTouch: body.style.touchAction,
    };
    root.style.overflowY = 'auto';
    root.style.height = 'auto';
    body.style.overflowY = 'auto';
    body.style.height = 'auto';
    body.style.touchAction = 'auto';
    return () => {
      root.style.overflowY = previous.rootOverflow;
      root.style.height = previous.rootHeight;
      body.style.overflowY = previous.bodyOverflow;
      body.style.height = previous.bodyHeight;
      body.style.touchAction = previous.bodyTouch;
    };
  }, []);

  // The slots that are already held, so a sales rep can see the difference.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/anchor-slots')
      .then((response) => (response.ok ? response.json() : { assignments: [] }))
      .then((result: { assignments?: AnchorAssignment[] }) => {
        if (!cancelled) setAssignments(result.assignments ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // The flyer can carry the station and the slot, so the buyer arrives with
  // the right slot already selected.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('station');
    if (sid && findStation(sid)) {
      setStationId(sid);
      setStationName(findStation(sid)?.name ?? '');
    }
    const sname = params.get('name');
    if (sname && !sid) setStationName(sname);
    const slotParam = Number(params.get('slot'));
    if (slotParam === 1 || slotParam === 2) {
      setSlot(slotParam);
      if (slotParam === 1) setPlan('annual');
    }
    const planParam = params.get('plan');
    if (planParam === 'monthly' || planParam === 'annual') setPlan(planParam);
    if (params.get('canceled') === '1') setCanceled(true);

    const sessionId = params.get('session_id');
    if (!sessionId) return;

    // The payment is only confirmed by Stripe, never by the query string.
    setCheckoutState('verifying');
    fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json())
      .then((result: Verification) => {
        if (result?.paid) {
          setReceipt(result.receipt ?? null);
          setVerified(result);
          setCheckoutState('paid');
        } else {
          setCheckoutState('failed');
        }
      })
      .catch(() => setCheckoutState('failed'));
  }, []);

  const currentHolder = useMemo(
    () => assignments.find((item) => item.stationId === stationId && item.slot === slot),
    [assignments, stationId, slot],
  );

  const startCheckout = async () => {
    if (!stationId) {
      setCheckoutError('Choose the station you want to anchor first.');
      return;
    }
    if (businessName.trim().length < 2) {
      setCheckoutError('Enter the name of your restaurant or business.');
      return;
    }
    if (!email.trim()) {
      setCheckoutError('Enter an email address so we can send your confirmation.');
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId,
          slot,
          plan,
          businessName: businessName.trim(),
          contactName: contactName.trim() || businessName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim(),
          deal: perkOffer.trim(),
        }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setCheckoutError(result.error ?? 'Checkout is unavailable right now.');
        return;
      }
      window.location.assign(result.url);
    } catch {
      setCheckoutError('We could not reach the server. Please try again.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div className="pricing-page min-h-[100dvh] bg-[#070B14] text-white flex flex-col items-center justify-between p-4 sm:p-6 font-sans w-full overflow-y-auto">
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

      <main className="w-full max-w-4xl my-auto py-8 flex flex-col items-center">
        {checkoutState === 'verifying' && (
          <div className="w-full max-w-xl mb-6 rounded-xl border border-cyan-500/40 bg-cyan-950/40 p-4 text-center text-sm text-cyan-100">
            Confirming your payment with Stripe…
          </div>
        )}
        {checkoutState === 'failed' && (
          <div className="w-full max-w-xl mb-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-center text-sm text-amber-200">
            We could not confirm that payment. If you were charged, contact us with your receipt and
            we will sort it out.
          </div>
        )}

        {isSuccess ? (
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

            {verified && (
              <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-400/30 text-cyan-200 text-xs font-mono mb-4">
                <span>
                  SLOT {verified.slot ?? slot} · {verified.plan ?? plan} PLAN
                </span>
                {!verified.slotPlanAllowed && (
                  <span className="text-amber-300">
                    This plan is not offered for slot {verified.slot}. Our team will contact you.
                  </span>
                )}
              </div>
            )}

            {receipt && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono mb-4">
                RECEIPT <strong className="text-white">{receipt}</strong>
              </div>
            )}

            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 my-4 text-left flex items-start gap-3">
              <Clock size={20} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cyan-200">
                  Welcome to the DPM - Go! Partnership Program! Please allow our team up to 24 hours
                  to review and approve your Station Anchor Slot.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  We are preparing your custom 3D map pin and dedicated rider perk banner.
                </p>
              </div>
            </div>

            <div className="text-sm py-3 border border-slate-700 rounded-lg bg-slate-950/40 my-4 text-left">
              {verified?.emailed ? (
                <p className="text-emerald-300 font-medium">
                  ✓ A confirmation email is on its way to{' '}
                  <strong className="text-white">{verified.email}</strong>. Keep your receipt code
                  handy if you need to reach us.
                </p>
              ) : (
                <p className="text-amber-300 font-medium">
                  Your payment is confirmed and your slot is in review. We could not send the
                  confirmation email automatically, so please contact us with your receipt code
                  {receipt ? ` ${receipt}` : ''} and we will send it by hand.
                </p>
              )}
            </div>

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

            <div className="w-full max-w-3xl mb-6 bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-300 mb-1">
                1 · Choose your station
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Every station has two sponsor slots: slot 1 is the annual partner, slot 2 rotates.
              </p>
              <label className={labelClass}>Target Station</label>
              <select
                value={stationId}
                onChange={(e) => {
                  const selected = findStation(e.target.value);
                  setStationId(e.target.value);
                  setStationName(selected?.name ?? '');
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">Choose a Detroit Station…</option>
                <optgroup label="People Mover (13 Stations)">
                  {peopleMoverStations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="QLINE (12 Stations)">
                  {qlineStations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {stationName && (
                <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-xs font-mono tracking-wider">
                  <MapPin size={13} className="text-cyan-400" /> CLAIMING AN ANCHOR FOR:{' '}
                  <strong className="text-white uppercase">{stationName}</strong>
                </p>
              )}
            </div>

            <div className="w-full max-w-3xl mb-6 bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-300 mb-1">
                2 · Choose your anchor slot
              </p>
              <p className="text-[11px] text-slate-400 mb-4">
                Slot 1 is the annual partner slot. Slot 2 is the rotating slot and can be bought
                monthly or annually.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {([1, 2] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSlot(value);
                      if (!plansAllowedForSlot(value).includes(plan)) {
                        setPlan(plansAllowedForSlot(value)[0] ?? 'annual');
                      }
                    }}
                    aria-pressed={slot === value}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-wider border ${
                      slot === value
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-950/70 text-cyan-200 border-slate-700'
                    }`}
                  >
                    SLOT {value}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {(['monthly', 'annual'] as const).map((value) => {
                  const allowed = plansAllowedForSlot(slot).includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!allowed}
                      onClick={() => setPlan(value)}
                      aria-pressed={plan === value}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold tracking-wider border disabled:opacity-40 ${
                        plan === value
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-950/70 text-amber-200 border-slate-700'
                      }`}
                    >
                      {PLAN_PRICES[value]}
                    </button>
                  );
                })}
                <span className="self-center text-[11px] text-slate-400">
                  {slot === 1
                    ? 'Slot 1 accepts the annual option only.'
                    : 'Slot 2 accepts both options.'}
                </span>
              </div>
              {currentHolder && (
                <p className="text-[11px] text-amber-200/90 border border-amber-500/25 bg-amber-950/20 rounded-lg px-3 py-2">
                  Slot {slot} at {stationName || 'this station'} is currently held by{' '}
                  <strong>{currentHolder.businessName}</strong>. A new purchase takes the slot over
                  once our team approves it.
                </p>
              )}
            </div>

            <div className="w-full max-w-3xl mb-6 bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-cyan-300 mb-1">
                3 · Tell us who you are
              </p>
              <p className="text-[11px] text-slate-400 mb-4">
                We use these to confirm your purchase and to set up your map pin. The confirmation
                email goes to the address below as soon as your payment clears.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Business / Restaurant Name</label>
                  <div className="relative">
                    <Building
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Lafayette Coney Island"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Point of Contact</label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Who should we reach out to?"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Manager Contact Email</label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@yourbusiness.com"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone (Optional)</label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(313) 555-0123"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Website (Optional)</label>
                  <div className="relative">
                    <Globe
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="yourbusiness.com"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Exclusive Rider Perk (Optional)</label>
                  <div className="relative">
                    <Tag
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={perkOffer}
                      onChange={(e) => setPerkOffer(e.target.value)}
                      placeholder="e.g. 15% off with People Mover ride proof"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-3xl mb-6 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3">
              <Clock size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-cyan-100">
                <strong className="text-cyan-300">Activation Timeline:</strong> Upon checkout, our
                team reviews and activates your station anchor placement within 24 hours. You will
                get a confirmation email right away.
              </p>
            </div>

            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutBusy}
              className="w-full max-w-3xl py-3 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {checkoutBusy
                ? 'STARTING CHECKOUT…'
                : `CHECKOUT · SLOT ${slot} · ${plan.toUpperCase()} · ${PLAN_PRICES[plan]}`}
            </button>
            {checkoutError && (
              <p className="mt-2 text-xs text-amber-300 text-center">{checkoutError}</p>
            )}
            {canceled && (
              <p className="mt-2 text-xs text-slate-300 text-center">
                Checkout was cancelled. No charge was made.
              </p>
            )}

            <p className="mt-4 text-[11px] text-slate-500 text-center max-w-xl">
              Payments are handled by Stripe. Your card details never touch our servers, and the
              price is set by us on the server so the slot and the plan always match.
              <a
                href="/"
                className="text-cyan-400 hover:underline ml-1 inline-flex items-center gap-1"
              >
                Back to the map <ExternalLink size={10} />
              </a>
            </p>
          </>
        )}
      </main>

      <footer className="w-full max-w-4xl pt-6 border-t border-cyan-500/20 text-center text-[10px] text-slate-400 font-mono tracking-wider flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>MOTORCITY AUTOMATED SYSTEMS · DPM - Go!</span>
        <span>Building Targeted Autonomous Solutions for Detroit</span>
      </footer>
    </div>
  );
}
