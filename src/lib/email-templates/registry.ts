import type { ComponentType } from 'react';
import { template as partnerConfirmation } from './partner-confirmation';
import type { PartnerConfirmationProps } from './partner-confirmation';

export interface TemplateEntry {
  component: ComponentType<PartnerConfirmationProps>;
  subject: string | ((data: PartnerConfirmationProps) => string);
  displayName?: string;
  previewData?: PartnerConfirmationProps;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'partner-confirmation': partnerConfirmation,
};
