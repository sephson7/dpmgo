import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Mail, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

function PricingPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [intakeDone, setIntakeDone] = useState(false);
  const stripeContainerRef = useRef<HTMLDivElement>(null);

  // Check URL parameters if redirected after Stripe checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true' || params.has('session_id')) {
        setIsSuccess(true);
      }
    }
  }, []);

  // Dynamically load Stripe's pricing table script and insert the custom element safely
  useEffect(() => {
    if (isSuccess) return;

    // Load Stripe Pricing Table Script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    // Create and attach the custom element dynamically
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
    if (submittedEmail) {
      setIntakeDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col items-center justify-between p-6 font-sans">
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1 mb-3">
              Station Anchor Secured
            </h2>

            {/* Explicit Onboarding Promise */}
            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 my-5 text-left flex items-start gap-3">
              <Clock size={20} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cyan-200">
                  Upon checkout, our team reviews and activates your station anchor placement within 24 hours.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  We will configure your 3D Mapbox pin, verify your exclusive rider perk, and lock your primary position at your chosen station.
                </p>
              </div>
            </div>

            {/* Quick Intake Form */}
            {!intakeDone ? (
              <form onSubmit={handleIntakeSubmit} className="mt-6 text-left">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Confirm Merchant Contact Email:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={submittedEmail}
                      onChange={e => setSubmittedEmail(e.target.value)}
                      placeholder="manager@yourbusiness.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-emerald-400 font-medium py-3 border border-emerald-500/30 rounded-lg bg-emerald-950/20">
                ✓ Intake received! Check your inbox shortly for asset confirmation.
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
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
                Select your preferred billing cycle below to secure your exclusive top-tier placement on DPM - Go!
              </p>
            </div>

            {/* Clear Onboarding Notice Before Checkout */}
            <div className="w-full max-w-3xl mb-6 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 flex items-center gap-3">
              <Clock size={18} className="text-cyan-400 shrink-0" />
              <p className="text-xs md:text-sm text-cyan-100">
                <strong className="text-cyan-300">Activation Timeline:</strong> Upon checkout, our team reviews and activates your station anchor placement within 24 hours.
              </p>
            </div>

            {/* Stripe Pricing Table Container */}
            <div className="w-full rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl p-6 shadow-2xl">
              <div ref={stripeContainerRef} className="w-full flex justify-center" />
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
