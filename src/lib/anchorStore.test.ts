import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** A minimal stand in for the Workers KV binding. */
function fakeKv() {
  const store = new Map<string, string>();
  return {
    store,
    async get(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list({ prefix = '' }: { prefix?: string } = {}) {
      const keys = [...store.keys()]
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

const contextWith = (kv: unknown) => ({ cloudflare: { env: { ANCHOR_STORE: kv } } });

const lead = (id: string) => ({
  id,
  receipt: `RCPT-${id}`,
  contactName: 'Casey Partner',
  businessName: 'Coney Co',
  email: 'casey@example.com',
  stationId: 'fort-cass',
  slot: 1 as const,
  plan: 'annual' as const,
  deal: 'Annual slot',
  status: 'pending' as const,
  createdAt: '2026-10-21T12:00:00.000Z',
});

const assignment = (slot: 1 | 2, businessName: string) => ({
  stationId: 'fort-cass',
  slot,
  kind: slot === 1 ? ('annual' as const) : ('rotating' as const),
  businessName,
  placeId: businessName.toLowerCase(),
  tagline: 'Official Downtown Anchor Partner',
  perk: 'Show DPM - Go! for 10% off dine-in orders',
  leadId: 'lead-1',
  assignedAt: '2026-10-21T12:00:00.000Z',
});

describe('anchor store on Cloudflare KV', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('keeps the leads in the namespace', async () => {
    const kv = fakeKv();
    const { addLead, listLeads } = await import('@/lib/anchorStore');
    const context = contextWith(kv);

    await addLead(lead('lead-1'), context);
    await addLead(lead('lead-2'), context);

    expect([...kv.store.keys()].sort()).toEqual(['anchor:lead:lead-1', 'anchor:lead:lead-2']);
    const leads = await listLeads(context);
    expect(leads.map((item) => item.id).sort()).toEqual(['lead-1', 'lead-2']);
  });

  it('updates the status of a lead in place', async () => {
    const kv = fakeKv();
    const { addLead, setLeadStatus, listLeads } = await import('@/lib/anchorStore');
    const context = contextWith(kv);

    await addLead(lead('lead-1'), context);
    const updated = await setLeadStatus('lead-1', 'approved', context);
    expect(updated?.status).toBe('approved');
    expect(updated?.approvedAt).toBeTruthy();

    const leads = await listLeads(context);
    expect(leads[0]?.status).toBe('approved');
  });

  it('holds one assignment per station and slot', async () => {
    const kv = fakeKv();
    const { assignSlot, listAssignments } = await import('@/lib/anchorStore');
    const context = contextWith(kv);

    await assignSlot(assignment(1, 'First Partner'), context);
    await assignSlot(assignment(1, 'Second Partner'), context);
    await assignSlot(assignment(2, 'Rotating Partner'), context);

    const assignments = await listAssignments(context);
    expect(assignments).toHaveLength(2);
    expect(assignments.find((item) => item.slot === 1)?.businessName).toBe('Second Partner');
    expect([...kv.store.keys()].sort()).toEqual([
      'anchor:assignment:fort-cass:1',
      'anchor:assignment:fort-cass:2',
    ]);
  });

  it('survives a restart of the runtime', async () => {
    const kv = fakeKv();
    const context = contextWith(kv);
    const first = await import('@/lib/anchorStore');
    await first.addLead(lead('lead-1'), context);
    await first.assignSlot(assignment(1, 'First Partner'), context);

    // A fresh module instance, as if the isolate restarted.
    vi.resetModules();
    const second = await import('@/lib/anchorStore');
    expect((await second.listLeads(context)).map((item) => item.id)).toEqual(['lead-1']);
    expect((await second.listAssignments(context)).map((item) => item.businessName)).toEqual([
      'First Partner',
    ]);
  });

  it('falls back to the local store when the binding is missing', async () => {
    const scratch = resolve(tmpdir(), `dpm-anchor-${process.pid}.json`);
    process.env['ANCHOR_STORE_PATH'] = scratch;
    vi.resetModules();
    const { addLead, listLeads } = await import('@/lib/anchorStore');
    try {
      await addLead(lead('local-lead'), { cloudflare: { env: {} } });
      const leads = await listLeads({ cloudflare: { env: {} } });
      expect(leads.map((item) => item.id)).toEqual(['local-lead']);
    } finally {
      delete process.env['ANCHOR_STORE_PATH'];
      rmSync(scratch, { force: true });
    }
  });
});
