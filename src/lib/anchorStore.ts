// Persistence for merchant intake leads and admin assigned anchor slots.
//
// On Cloudflare Workers the records live in a KV namespace (the ANCHOR_STORE
// binding), so an approval survives a restart and every isolate sees the same
// data. KV is the right store for this shape: a handful of writes, a read of
// the whole set on every page load, and no queries that need a schema.
//
// Locally, and on a runtime without the binding, the store falls back to a
// JSON file and then to memory, so nothing breaks before the namespace is set
// up.

import type { CheckoutHold } from '@/lib/slotExclusivity';

export type AnchorLeadStatus = 'pending' | 'approved' | 'rejected';

export type AnchorLead = {
  id: string;
  receipt: string;
  contactName: string;
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  stationId: string;
  slot: 1 | 2;
  plan: 'monthly' | 'annual';
  deal: string;
  notes?: string;
  status: AnchorLeadStatus;
  createdAt: string;
  approvedAt?: string;
  /** The Stripe session this lead was paid for. One lead per session. */
  sessionId?: string;
  /** When the confirmation email went out. It is only ever sent once. */
  receiptSentAt?: string;
  /** Which transport delivered the confirmation. */
  receiptTransport?: string;
  /** What was actually charged, in cents. */
  paidAmountCents?: number;
  /** The merchant agreement version accepted before payment. */
  agreementVersion?: string;
  /** When the merchant accepted it. */
  agreementAcceptedAt?: string;
};
export type AnchorAssignment = {
  stationId: string;
  slot: 1 | 2;
  kind: 'annual' | 'rotating';
  businessName: string;
  placeId: string;
  tagline: string;
  perk: string;
  rotation?: string;
  leadId: string;
  assignedAt: string;
  /** When an annual exclusive term ends; the slot cannot be resold before. */
  termEndsAt?: string;
};

export type AnchorStoreShape = {
  leads: AnchorLead[];
  assignments: AnchorAssignment[];
};

const EMPTY: AnchorStoreShape = { leads: [], assignments: [] };
/** Where the local fallback writes. Overridable so a test can use a scratch file. */
const STORE_PATH =
  (typeof process !== 'undefined' ? process.env?.['ANCHOR_STORE_PATH'] : undefined) ??
  'data/anchor-store.json';

const LEAD_PREFIX = 'anchor:lead:';
const ASSIGNMENT_PREFIX = 'anchor:assignment:';
/** How long a read is served from the isolate cache before it hits KV. */
const SNAPSHOT_TTL_MS = 20_000;

/** The slice of the Workers KV binding the store uses. */
type KVNamespace = {
  get(key: string, type: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string | undefined }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
};

/**
 * The KV namespace binding, when the runtime provides one. The portal is
 * closed without it, so the store falls back to the local file.
 */
function kvBinding(context?: unknown): KVNamespace | null {
  const env = (context as { cloudflare?: { env?: Record<string, unknown> } } | undefined)
    ?.cloudflare?.env;
  const binding = env?.['ANCHOR_STORE'];
  if (!binding || typeof binding !== 'object') return null;
  const candidate = binding as Partial<KVNamespace>;
  if (typeof candidate.get !== 'function' || typeof candidate.put !== 'function') return null;
  if (typeof candidate.list !== 'function') return null;
  return candidate as KVNamespace;
}

/* --------------------------------------------------------------- local copy */

let memory: AnchorStoreShape | null = null;

async function readFromDisk(): Promise<AnchorStoreShape | null> {
  try {
    const fs = await import('node:fs/promises');
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AnchorStoreShape>;
    return {
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
    };
  } catch {
    return null;
  }
}

async function writeToDisk(store: AnchorStoreShape): Promise<void> {
  try {
    const fs = await import('node:fs/promises');
    await fs.mkdir('data', { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // No filesystem available: the in-memory copy stays authoritative.
  }
}

/* --------------------------------------------------------------------- KV */

type Snapshot = { store: AnchorStoreShape; at: number };

/** The isolate cache: a short lived copy plus the records it knows about. */
let snapshot: Snapshot | null = null;
const known = {
  leads: new Map<string, AnchorLead>(),
  assignments: new Map<string, AnchorAssignment>(),
};

async function listKeys(kv: KVNamespace, prefix: string): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix, cursor });
    for (const key of page.keys) names.push(key.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return names;
}

async function readKvStore(kv: KVNamespace): Promise<AnchorStoreShape> {
  const [leadKeys, assignmentKeys] = await Promise.all([
    listKeys(kv, LEAD_PREFIX),
    listKeys(kv, ASSIGNMENT_PREFIX),
  ]);

  const [leadValues, assignmentValues] = await Promise.all([
    Promise.all(leadKeys.map((key) => kv.get(key, 'text'))),
    Promise.all(assignmentKeys.map((key) => kv.get(key, 'text'))),
  ]);

  const leads: AnchorLead[] = [];
  leadKeys.forEach((key, index) => {
    const raw = leadValues[index];
    const parsed = raw
      ? (JSON.parse(raw) as AnchorLead)
      : known.leads.get(key.slice(LEAD_PREFIX.length));
    if (parsed) leads.push(parsed);
  });

  const assignments: AnchorAssignment[] = [];
  assignmentKeys.forEach((key, index) => {
    const raw = assignmentValues[index];
    const parsed = raw
      ? (JSON.parse(raw) as AnchorAssignment)
      : known.assignments.get(key.slice(ASSIGNMENT_PREFIX.length));
    if (parsed) assignments.push(parsed);
  });

  return { leads, assignments };
}

/**
 * Reads the whole store, from KV when it is bound and from the local file
 * otherwise. The isolate cache keeps a page load from turning into a read per
 * record.
 */
async function readStore(context?: unknown): Promise<AnchorStoreShape> {
  const kv = kvBinding(context);
  if (!kv) {
    const fromDisk = await readFromDisk();
    if (fromDisk) {
      memory = fromDisk;
      return fromDisk;
    }
    if (!memory) memory = { ...EMPTY, leads: [], assignments: [] };
    return memory;
  }

  if (snapshot && Date.now() - snapshot.at < SNAPSHOT_TTL_MS) return snapshot.store;

  const store = await readKvStore(kv);
  snapshot = { store, at: Date.now() };
  return store;
}

async function writeStore(store: AnchorStoreShape, context?: unknown): Promise<void> {
  const kv = kvBinding(context);
  if (!kv) {
    memory = store;
    await writeToDisk(store);
    return;
  }
  snapshot = { store, at: Date.now() };
}

/* ------------------------------------------------------------- public API */

/** The assignments an admin has made, one per station and slot. */
export async function listAssignments(context?: unknown): Promise<AnchorAssignment[]> {
  const store = await readStore(context);
  return store.assignments;
}

/**
 * Assigns a slot. One assignment per station and slot, so approving a new
 * buyer always replaces the previous holder of that slot.
 */
export async function assignSlot(
  assignment: AnchorAssignment,
  context?: unknown,
): Promise<AnchorAssignment> {
  const store = await readStore(context);
  const next: AnchorAssignment[] = [
    ...store.assignments.filter(
      (item) => !(item.stationId === assignment.stationId && item.slot === assignment.slot),
    ),
    assignment,
  ];
  await writeStore({ ...store, assignments: next }, context);

  const kv = kvBinding(context);
  if (kv) {
    const key = `${ASSIGNMENT_PREFIX}${assignment.stationId}:${assignment.slot}`;
    known.assignments.set(`${assignment.stationId}:${assignment.slot}`, assignment);
    await kv.put(key, JSON.stringify(assignment));
  }
  return assignment;
}

/** Every merchant intake lead, newest first. */
export async function listLeads(context?: unknown): Promise<AnchorLead[]> {
  const store = await readStore(context);
  return [...store.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Records a new lead. */
export async function addLead(lead: AnchorLead, context?: unknown): Promise<AnchorLead> {
  const store = await readStore(context);
  await writeStore({ ...store, leads: [lead, ...store.leads] }, context);

  const kv = kvBinding(context);
  if (kv) {
    known.leads.set(lead.id, lead);
    await kv.put(`${LEAD_PREFIX}${lead.id}`, JSON.stringify(lead));
  }
  return lead;
}

/**
 * The lead that was created for a paid Stripe session. A confirmation is only
 * sent once per session, so this is how a repeat delivery is stopped.
 */
export async function findLeadBySessionId(
  sessionId: string,
  context?: unknown,
): Promise<AnchorLead | null> {
  if (!sessionId) return null;
  const store = await readStore(context);
  return store.leads.find((lead) => lead.sessionId === sessionId) ?? null;
}

/** Writes a changed lead back to the store. */
export async function updateLead(lead: AnchorLead, context?: unknown): Promise<AnchorLead> {
  const store = await readStore(context);
  await writeStore(
    { ...store, leads: store.leads.map((item) => (item.id === lead.id ? lead : item)) },
    context,
  );

  const kv = kvBinding(context);
  if (kv) {
    known.leads.set(lead.id, lead);
    await kv.put(`${LEAD_PREFIX}${lead.id}`, JSON.stringify(lead));
  }
  return lead;
}

/** Moves a lead to the approved or rejected state. */
export async function setLeadStatus(
  id: string,
  status: AnchorLeadStatus,
  context?: unknown,
): Promise<AnchorLead | null> {
  const store = await readStore(context);
  const lead = store.leads.find((item) => item.id === id);
  if (!lead) return null;
  lead.status = status;
  if (status === 'approved') lead.approvedAt = new Date().toISOString();
  await writeStore(store, context);

  const kv = kvBinding(context);
  if (kv) {
    known.leads.set(id, lead);
    await kv.put(`${LEAD_PREFIX}${id}`, JSON.stringify(lead));
  }
  return lead;
}

/* --------------------------------------------------------- checkout holds */

const HOLD_PREFIX = 'anchor:hold:';
const memoryHolds = new Map<string, CheckoutHold>();

/** Every checkout hold, expired ones included (callers filter by time). */
export async function listCheckoutHolds(context?: unknown): Promise<CheckoutHold[]> {
  const kv = kvBinding(context);
  if (!kv) return [...memoryHolds.values()];
  const keys = await listKeys(kv, HOLD_PREFIX);
  const values = await Promise.all(keys.map((key) => kv.get(key, 'text')));
  return values.filter((v): v is string => Boolean(v)).map((v) => JSON.parse(v) as CheckoutHold);
}

/** Records a hold, one key per station and slot. */
export async function putCheckoutHold(hold: CheckoutHold, context?: unknown): Promise<void> {
  const id = `${hold.stationId}:${hold.slot}`;
  const kv = kvBinding(context);
  if (!kv) {
    memoryHolds.set(id, hold);
    return;
  }
  await kv.put(`${HOLD_PREFIX}${id}`, JSON.stringify(hold));
}
