import { ExternalLink, HelpCircle } from 'lucide-react';

export type ComplianceFooterProps = {
  /** Opens the terms, privacy or disclaimer dialog. */
  onOpenLegal: (document: 'terms' | 'privacy' | 'disclaimer') => void;
  /** Opens the rider guide. */
  onOpenGuide: () => void;
};

/**
 * The compliance footer: the attribution, the legal links and the partner
 * portal. The non-affiliation notice lives behind the Disclaimer button so
 * the footer stays a short dock on a phone.
 */
export default function ComplianceFooter({ onOpenLegal, onOpenGuide }: ComplianceFooterProps) {
  return (
    <footer className="compliance-footer">
      <div className="footer-brand-wrap">
        <span className="footer-title">MOTORCITY AUTOMATED SYSTEMS</span>
        <span className="footer-sub">Building Targeted Autonomous Civic-Tech Solutions</span>
      </div>

      <div className="footer-links">
        <a
          href="https://www.thepeoplemover.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-external"
        >
          thepeoplemover.com <ExternalLink size={11} />
        </a>
        <span className="footer-divider">·</span>
        <button type="button" onClick={onOpenGuide} className="legal-btn footer-guide-btn">
          <HelpCircle size={11} /> How It Works
        </button>
        <span className="footer-divider">·</span>
        <button type="button" onClick={() => onOpenLegal('terms')} className="legal-btn">
          Terms &amp; Conditions
        </button>
        <span className="footer-divider">·</span>
        <button type="button" onClick={() => onOpenLegal('privacy')} className="legal-btn">
          Privacy Policy
        </button>
        <span className="footer-divider">·</span>
        <button type="button" onClick={() => onOpenLegal('disclaimer')} className="legal-btn">
          Disclaimer
        </button>
        <span className="footer-divider">·</span>
        <a href="/admin" className="legal-btn">
          Partner Admin
        </a>
      </div>
    </footer>
  );
}
