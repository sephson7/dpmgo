import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

function PricingPage() {
  // Automatically load Stripe's pricing table script when the page mounts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount
      document.body.removeChild(script);
    };
  }, []);

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

      {/* Main Pricing Table Container */}
      <main className="w-full max-w-4xl my-auto py-8 flex flex-col items-center">
        <div className="text-center mb-8 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Station Anchor Partnership
          </h2>
          <p className="text-gray-400 text-sm">
            Select your preferred billing cycle below to secure your exclusive top-tier placement on DPM - Go!
          </p>
        </div>

        {/* Stripe Pricing Table Component */}
        <div className="w-full rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl p-6 shadow-2xl">
          <stripe-pricing-table
            pricing-table-id="prctbl_1UQ9Ky57MO63Hzo12cFECrWf"
            publishable-key="pk_live_51UQ8Q957MO63Hzo1kKCL8z2xUtv75B87HNnp6Hd99EPMYlltLeUMNuCYUd1HhCoeFQT7G3irEuFkU7GiPedJ5Sek00Q16TKFlW"
          ></stripe-pricing-table>
        </div>
      </main>

      {/* Footer Compliance Stamp */}
      <footer className="w-full max-w-4xl pt-6 border-t border-cyan-500/20 text-center text-[10px] text-slate-400 font-mono tracking-wider flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>MOTORCITY AUTOMATED SYSTEMS · DPM - Go!</span>
        <span>Building Targeted Autonomous Solutions for Detroit</span>
      </footer>
    </div>
  );
}