// Persistence for merchant intake leads and admin assigned anchor slots.
// Uses a JSON file when the runtime has a filesystem (local + node preview)
// and falls back to an in-memory store on edge runtimes.

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
};

export type AnchorStoreShape = {
  leads: AnchorLead[];
  assignments: AnchorAssignment[];
};

const EMPTY: AnchorStoreShape = { leads: [], assignments: [] };
const STORE_PATH = 'data/anchor-store.json';

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

export async function readAnchorStore(): Promise<AnchorStoreShape> {
  const fromDisk = await readFromDisk();
  if (fromDisk) {
    memory = fromDisk;
    return fromDisk;
  }
  if (!memory) memory = { ...EMPTY, leads: [], assignments: [] };
  return memory;
}

export async function writeAnchorStore(store: AnchorStoreShape): Promise<void> {
  memory = store;
  await writeToDisk(store);
}

export async function listLeads(): Promise<AnchorLead[]> {
  const store = await readAnchorStore();
  return [...store.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addLead(lead: AnchorLead): Promise<AnchorLead> {
  const store = await readAnchorStore();
  store.leads = [lead, ...store.leads];
  await writeAnchorStore(store);
  return lead;
}

export async function setLeadStatus(id: string, status: AnchorLeadStatus): Promise<AnchorLead | null> {
  const store = await readAnchorStore();
  const lead = store.leads.find(item => item.id === id);
  if (!lead) return null;
  lead.status = status;
  if (status === 'approved') lead.approvedAt = new Date().toISOString();
  await writeAnchorStore(store);
  return lead;
}

/**
 * Assigns a slot. One assignment per station and slot, so approving a new
 * buyer always replaces the previous holder of that slot.
 */
export async function assignSlot(assignment: AnchorAssignment): Promise<AnchorAssignment> {
  const store = await readAnchorStore();
  store.assignments = [
    ...store.assignments.filter(
      item => !(item.stationId === assignment.stationId && item.slot === assignment.slot)
    ),
    assignment,
  ];
  await writeAnchorStore(store);
  return assignment;
}

export async function listAssignments(): Promise<AnchorAssignment[]> {
  const store = await readAnchorStore();
  return store.assignments;
}
