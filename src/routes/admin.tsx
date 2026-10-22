import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Mail, MapPin, ShieldCheck, Tag, X } from 'lucide-react';
import { peopleMoverStations, qlineStations } from '@/data/transit';

type Lead = {
  id: string;
  receipt: string;
  contactName: string;
  businessName: string;
  email: string;
  phone?: string;
  stationId: string;
  slot: 1 | 2;
  plan: 'monthly' | 'annual';
  deal: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  /** When the confirmation email went out. */
  receiptSentAt?: string;
  /** Which transport delivered it. */
  receiptTransport?: string;
  /** The Stripe session the lead was paid for. */
  sessionId?: string;
};

type Assignment = {
  stationId: string;
  slot: 1 | 2;
  businessName: string;
  placeId: string;
  tagline: string;
  perk: string;
  rotation?: string;
  leadId: string;
  assignedAt: string;
};

const stationName = (id: string) =>
  [...peopleMoverStations, ...qlineStations].find((station) => station.id === id)?.name ?? id;

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: 'Partner Admin | DPM - Go!' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminPortal,
});

function AdminPortal() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/leads');
    if (response.status === 401) {
      setSignedIn(false);
      return;
    }
    if (response.status === 503) {
      // The deployment has no portal secrets, so there is nothing to sign in to.
      setNotConfigured(true);
      setSignedIn(false);
      return;
    }
    if (!response.ok) return;
    const result = (await response.json()) as { leads?: Lead[]; assignments?: Assignment[] };
    setLeads(result.leads ?? []);
    setAssignments(result.assignments ?? []);
    setSignedIn(true);
  }, []);

  useEffect(() => {
    load().finally(() => setChecking(false));
  }, [load]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? 'Sign in failed.');
        return;
      }
      setUsername('');
      setPassword('');
      await load();
    } catch {
      setError('We could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setSignedIn(false);
    setLeads([]);
    setAssignments([]);
  };

  const act = async (leadId: string, action: 'approve' | 'reject') => {
    setBusy(true);
    try {
      await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, action }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pricing-page min-h-[100dvh] bg-[#070B14] text-white flex flex-col items-center p-4 sm:p-6 font-sans w-full overflow-y-auto">
      <header className="w-full max-w-4xl flex items-center justify-between pb-6 border-b border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            DPM
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider text-cyan-400">PARTNER ADMIN</h1>
            <p className="text-xs text-slate-400">
              Anchor slot approvals · Motorcity Automated Systems
            </p>
          </div>
        </div>
        <a href="/" className="text-cyan-400 hover:underline flex items-center gap-1 text-sm">
          ← Back to map
        </a>
      </header>

      <main className="w-full max-w-4xl py-8 flex flex-col items-center">
        {checking ? (
          <p className="text-sm text-slate-400 py-8">Checking session…</p>
        ) : notConfigured ? (
          <div className="w-full max-w-md bg-slate-900/60 border border-amber-500/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-white mb-1">
              Portal not configured
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This deployment has no partner portal credentials, so the portal is closed. Set{' '}
              <code className="text-amber-300">ADMIN_USERNAME</code>,{' '}
              <code className="text-amber-300">ADMIN_PASSWORD</code> and{' '}
              <code className="text-amber-300">ADMIN_SESSION_SECRET</code> as deployment secrets to
              open it. There are no default credentials.
            </p>
          </div>
        ) : !signedIn ? (
          <form
            onSubmit={signIn}
            className="w-full max-w-md bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-6 space-y-4"
          >
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-1">Admin sign in</h2>
              <p className="text-xs text-slate-400">
                Review anchor slot purchases and assign slots to stations.
              </p>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <ShieldCheck size={14} /> {busy ? 'SIGNING IN…' : 'SIGN IN'}
            </button>
            {error && <p className="text-xs text-amber-300">{error}</p>}
          </form>
        ) : (
          <div className="w-full space-y-6">
            <section className="bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Merchant intake leads</h2>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-cyan-300"
                >
                  Sign out
                </button>
              </div>
              {leads.length === 0 ? (
                <p className="text-sm text-slate-400">No merchant submissions yet.</p>
              ) : (
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-4 flex flex-col gap-2"
                    >
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{lead.businessName}</p>
                          <p className="text-xs text-slate-400">
                            {lead.contactName} · {lead.email}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${
                            lead.status === 'approved'
                              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30'
                              : lead.status === 'rejected'
                                ? 'text-rose-300 border-rose-500/40 bg-rose-950/30'
                                : 'text-amber-300 border-amber-500/40 bg-amber-950/30'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 flex items-center gap-2">
                        <MapPin size={12} className="text-cyan-400" />
                        {stationName(lead.stationId)} · Slot {lead.slot} · {lead.plan} plan
                      </p>
                      <p className="text-xs text-slate-300 flex items-center gap-2">
                        <Tag size={12} className="text-cyan-400" />
                        {lead.deal}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Clock3 size={12} />
                        {new Date(lead.createdAt).toLocaleString()} · ref {lead.receipt}
                      </p>
                      <p className="text-[11px] flex items-center gap-2">
                        <Mail
                          size={12}
                          className={lead.receiptSentAt ? 'text-emerald-400' : 'text-amber-300'}
                        />
                        {lead.receiptSentAt ? (
                          <span className="text-emerald-300">
                            Confirmation sent {new Date(lead.receiptSentAt).toLocaleString()}
                            {lead.receiptTransport ? ` via ${lead.receiptTransport}` : ''}
                          </span>
                        ) : (
                          <span className="text-amber-300">
                            No confirmation email sent yet — follow up with the merchant.
                          </span>
                        )}
                      </p>
                      {lead.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => act(lead.id, 'approve')}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-cyan-400 disabled:opacity-60 flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={13} /> Approve &amp; assign slot
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => act(lead.id, 'reject')}
                            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-[11px] font-mono font-bold uppercase tracking-wider hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-60 flex items-center gap-1.5"
                          >
                            <X size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg font-bold text-white mb-4">Assigned anchor slots</h2>
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-400">No slots assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((item) => (
                    <div
                      key={`${item.stationId}-${item.slot}`}
                      className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3 flex flex-wrap items-center gap-3 justify-between"
                    >
                      <div>
                        <p className="text-sm text-white">{item.businessName}</p>
                        <p className="text-xs text-slate-400">
                          {stationName(item.stationId)} · Slot {item.slot}
                          {item.rotation ? ` · ${item.rotation}` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-slate-300">{item.perk}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <a
              href="/partner"
              className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline"
            >
              Open the partner checkout page <ArrowRight size={13} />
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
