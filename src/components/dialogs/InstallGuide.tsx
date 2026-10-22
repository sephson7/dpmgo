import { useEffect, useState } from 'react';
import { CheckCircle2, Download, MoreVertical, PlusSquare, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOs) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/**
 * The "Add to Home Screen" tab. Chrome on Android can install straight from
 * a button; iPhone Safari never lets a site do that, so it shows the steps.
 */
export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform>('other');
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setPromptEvent(null);
  };

  if (installed) {
    return (
      <div className="walkthrough-step">
        <div className="walkthrough-step-icon">
          <CheckCircle2 size={18} />
        </div>
        <div className="walkthrough-step-content">
          <div className="walkthrough-step-title">You're all set</div>
          <p className="walkthrough-step-desc">DPM - Go! is already on your home screen.</p>
        </div>
      </div>
    );
  }

  const iosSteps = [
    {
      icon: Share,
      title: '1. Tap Share',
      desc: (
        <>
          In Safari, tap the <strong>Share</strong> button (the square with an arrow) at the bottom
          of the screen.
        </>
      ),
    },
    {
      icon: PlusSquare,
      title: '2. Add to Home Screen',
      desc: (
        <>
          Scroll down and tap <strong>Add to Home Screen</strong>.
        </>
      ),
    },
    {
      icon: CheckCircle2,
      title: '3. Tap Add',
      desc: (
        <>
          Tap <strong>Add</strong> in the top corner. The DPM - Go! icon appears on your home
          screen.
        </>
      ),
    },
  ];
  const androidSteps = [
    {
      icon: MoreVertical,
      title: '1. Open the menu',
      desc: (
        <>
          In Chrome, tap the <strong>three dots</strong> in the top right corner.
        </>
      ),
    },
    {
      icon: PlusSquare,
      title: '2. Add to Home screen',
      desc: (
        <>
          Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.
        </>
      ),
    },
    {
      icon: CheckCircle2,
      title: '3. Confirm',
      desc: (
        <>
          Tap <strong>Install</strong>. The DPM - Go! icon appears on your home screen.
        </>
      ),
    },
  ];
  const steps = platform === 'ios' ? iosSteps : androidSteps;

  return (
    <>
      <p className="walkthrough-step-desc">
        Save DPM - Go! to your phone so it opens like an app, full screen, with one tap.
      </p>

      {promptEvent && (
        <Button
          type="button"
          variant="hudActive"
          size="sm"
          onClick={install}
          className="install-now-btn"
        >
          <Download size={14} /> Install DPM - Go!
        </Button>
      )}

      {platform === 'other' && (
        <p className="walkthrough-step-desc">
          On a computer? Open <strong>dpmgo.app</strong> on your phone, then follow these steps.
          iPhone users: use Safari, tap Share, then Add to Home Screen.
        </p>
      )}

      {steps.map(({ icon: Icon, title, desc }) => (
        <div className="walkthrough-step" key={title}>
          <div className="walkthrough-step-icon">
            <Icon size={18} />
          </div>
          <div className="walkthrough-step-content">
            <div className="walkthrough-step-title">{title}</div>
            <p className="walkthrough-step-desc">{desc}</p>
          </div>
        </div>
      ))}
    </>
  );
}
