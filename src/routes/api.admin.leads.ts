import { createFileRoute } from '@tanstack/react-router';
import { adminPortalConfigured, readAdminCookie, verifyAdminToken } from '@/lib/adminAuth';
import { listSlotStats } from '@/lib/slotStats';
import { listDrawerOpens } from '@/lib/stationStats';
import {
  addLead,
  assignSlot,
  listAssignments,
  listLeads,
  setLeadStatus,
  type AnchorAssignment,
  type AnchorLeadStatus,
} from '@/lib/anchorStore';
import {
  activeExclusiveHold,
  exclusiveTermEnd,
  formatTermEnd,
  termEndForPlan,
} from '@/lib/slotExclusivity';

const STATION_ID_PATTERN = /^[a-z0-9-]{2,64}$/;

export const Route = createFileRoute('/api/admin/leads')({
  server: {
    handlers: {
      // Lists the merchant intake leads and the assigned anchor slots.
      GET: async ({ request, context }) => {
        if (!(await adminPortalConfigured(context))) {
          return Response.json(
            { error: 'The partner portal is not configured on this deployment.' },
            { status: 503 },
          );
        }
        const remaining = await verifyAdminToken(readAdminCookie(request), context);
        if (remaining === null) {
          return Response.json({ error: 'Not signed in.' }, { status: 401 });
        }
        const [leads, assignments, stats, stationOpens] = await Promise.all([
          listLeads(context),
          listAssignments(context),
          listSlotStats(context),
          listDrawerOpens(context),
        ]);
        return Response.json(
          { leads, assignments, stats, stationOpens },
          { headers: { 'Cache-Control': 'no-store' } },
        );
      },

      // Approves or rejects a lead, and assigns the anchor slot it paid for.
      POST: async ({ request, context }) => {
        if (!(await adminPortalConfigured(context))) {
          return Response.json(
            { error: 'The partner portal is not configured on this deployment.' },
            { status: 503 },
          );
        }
        const remaining = await verifyAdminToken(readAdminCookie(request), context);
        if (remaining === null) {
          return Response.json({ error: 'Not signed in.' }, { status: 401 });
        }
        let payload: {
          leadId?: string;
          action?: 'approve' | 'reject' | 'assign';
          stationId?: string;
          slot?: number;
          businessName?: string;
          tagline?: string;
          perk?: string;
          rotation?: string;
        };
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: 'Invalid request.' }, { status: 400 });
        }

        const leadId = typeof payload.leadId === 'string' ? payload.leadId : '';
        if (!leadId) {
          return Response.json({ error: 'A lead id is required.' }, { status: 400 });
        }
        const leads = await listLeads(context);
        const lead = leads.find((item) => item.id === leadId);
        if (!lead) {
          return Response.json({ error: 'Unknown lead.' }, { status: 404 });
        }

        const action = payload.action ?? 'approve';
        if (action === 'reject') {
          const updated = await setLeadStatus(leadId, 'rejected', context);
          return Response.json({ ok: true, lead: updated });
        }

        const stationId =
          typeof payload.stationId === 'string' && STATION_ID_PATTERN.test(payload.stationId)
            ? payload.stationId
            : lead.stationId;
        const slot = payload.slot === 1 || payload.slot === 2 ? payload.slot : lead.slot;
        const businessName =
          (typeof payload.businessName === 'string' && payload.businessName.trim()) ||
          lead.businessName;

        // Never let an approval displace an annual partner mid-term.
        const hold = activeExclusiveHold(await listAssignments(context), stationId, slot);
        if (hold && hold.leadId !== leadId) {
          const end = exclusiveTermEnd(hold);
          return Response.json(
            {
              error: `Slot ${slot} is held by ${hold.businessName} under an annual term${
                end ? ` through ${formatTermEnd(end)}` : ''
              }. Assign this buyer a different station or slot, or reject and refund.`,
            },
            { status: 409 },
          );
        }

        const now = new Date();
        const termEndsAt = termEndForPlan(lead.plan, now);
        const assignment: AnchorAssignment = {
          stationId,
          slot,
          kind: slot === 1 ? 'annual' : 'rotating',
          businessName,
          placeId: leadId,
          tagline:
            (typeof payload.tagline === 'string' && payload.tagline.trim()) ||
            `Official ${stationId} partner`,
          perk: (typeof payload.perk === 'string' && payload.perk.trim()) || lead.deal,
          ...(typeof payload.rotation === 'string' && payload.rotation.trim()
            ? { rotation: payload.rotation.trim() }
            : {}),
          leadId,
          assignedAt: now.toISOString(),
          ...(termEndsAt ? { termEndsAt } : {}),
        };
        const saved = await assignSlot(assignment, context);
        const updated = await setLeadStatus(leadId, 'approved', context);
        return Response.json({ ok: true, lead: updated, assignment: saved });
      },
    },
  },
});
