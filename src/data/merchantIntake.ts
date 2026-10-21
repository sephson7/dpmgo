import { z } from 'zod';

/**
 * Merchant onboarding intake. Captures the point of contact, the restaurant
 * name and the featured deal that will run in a station anchor slot.
 */
export const merchantIntakeSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(2, 'Enter the name of the person we should contact.')
    .max(80, 'Contact name is too long.'),
  businessName: z
    .string()
    .trim()
    .min(2, 'Enter the restaurant or business name.')
    .max(80, 'Business name is too long.'),
  email: z.string().trim().email('Enter a valid email address.').max(120, 'Email is too long.'),
  phone: z.string().trim().max(30, 'Phone number is too long.').optional().or(z.literal('')),
  website: z.string().trim().max(200, 'Website is too long.').optional().or(z.literal('')),
  stationId: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,64}$/, 'Choose a station for the anchor slot.')
    .optional()
    .or(z.literal('')),
  slot: z.union([z.literal(1), z.literal(2), z.literal(0)]),
  plan: z.union([z.literal('monthly'), z.literal('annual')]).default('annual'),
  deal: z
    .string()
    .trim()
    .min(4, 'Describe the rider deal you want to feature.')
    .max(160, 'Keep the deal description under 160 characters.'),
  notes: z.string().trim().max(500, 'Notes are too long.').optional().or(z.literal('')),
});

export type MerchantIntake = z.infer<typeof merchantIntakeSchema>;

export type IntakeResult =
  | { ok: true; value: MerchantIntake }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function parseMerchantIntake(payload: unknown): IntakeResult {
  const parsed = merchantIntakeSchema.safeParse(payload);
  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: 'Please check the highlighted fields.', fieldErrors };
}

/** Short receipt code the merchant can quote when they follow up. */
export function intakeReceiptId(intake: MerchantIntake): string {
  const seed = `${intake.businessName}|${intake.stationId || 'any'}|${intake.slot}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `DPM-${hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}
