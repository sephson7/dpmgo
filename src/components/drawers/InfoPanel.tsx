import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawerClose, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { activities, sportsTeams } from '@/data/transit';

export type InfoPanelProps = {
  /** The panel that is open, if any. */
  panel: string | null;
};

/** The downtown activities and Detroit sports panels. */
export default function InfoPanel({ panel }: InfoPanelProps) {
  if (panel === 'activities') {
    return (
      <>
        <DrawerHeader className="detail-heading">
          <div className="drawer-header-top">
            <div className="drawer-eyebrow">DOWNTOWN CALENDAR</div>
            <DrawerClose asChild>
              <button type="button" className="drawer-close-btn" aria-label="Close activities drawer">
                <X size={18} />
              </button>
            </DrawerClose>
          </div>
          <DrawerTitle>Public Activities</DrawerTitle>
          <DrawerDescription>Downtown Detroit and Woodward corridor events.</DrawerDescription>
        </DrawerHeader>
        <div className="info-list">
          {activities.map((a, i) => (
            <a key={i} href={a.href} target="_blank" rel="noopener noreferrer" className="restaurant-item">
              <span className="restaurant-main">
                <strong>{a.name}</strong>
                <small>
                  {a.area} · nearest stop: {a.station}
                </small>
                <p className="activity-note">{a.note}</p>
              </span>
              <ExternalLink size={15} className="restaurant-arrow" />
            </a>
          ))}
        </div>
      </>
    );
  }

  const team = sportsTeams.find(item => item.id === panel);
  if (!team) return null;

  return (
    <>
      <DrawerHeader className="detail-heading">
        <div className="drawer-header-top">
          <div className="drawer-eyebrow">{team.league} / DETROIT SPORTS</div>
          <DrawerClose asChild>
            <button type="button" className="drawer-close-btn" aria-label="Close sports details">
              <X size={18} />
            </button>
          </DrawerClose>
        </div>
        <DrawerTitle>{team.team}</DrawerTitle>
        <DrawerDescription>
          {team.venue} · ride to {team.station}
        </DrawerDescription>
      </DrawerHeader>
      <div className="info-list">
        <div className="detail-stats">
          <div>
            <span>NEXT / RECENT GAME</span>
            <strong className="arrival-unavailable">Live data coming soon</strong>
          </div>
          <div>
            <span>VENUE</span>
            <strong className="next-stop">{team.venue}</strong>
          </div>
          <div>
            <span>NEAREST STOP</span>
            <strong className="next-stop">{team.station}</strong>
          </div>
        </div>
        <Button variant="hudActive" asChild className="info-button">
          <a href={team.href} target="_blank" rel="noopener noreferrer">
            OFFICIAL SCHEDULE <ExternalLink size={13} />
          </a>
        </Button>
      </div>
    </>
  );
}
