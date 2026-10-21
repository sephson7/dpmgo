// Venue branding for the dining and sponsor cards in the station drawer.

const diningImages = import.meta.glob<{ url: string }>('/src/assets/dining/*.asset.json', {
  eager: true,
  import: 'default',
});

const diningImage = (id: string) => diningImages[`/src/assets/dining/${id}.jpg.asset.json`]?.url;

/**
 * Resolves the brand mark for a venue: the local photo when there is one,
 * otherwise the favicon of the venue's own domain.
 */
export function getVenueLogo(venue: {
  id: string;
  url?: string;
  imageUrl?: string;
}): string | null {
  if (venue.imageUrl) return venue.imageUrl;
  const local = diningImage(venue.id);
  if (local) return local;
  if (venue.url) {
    try {
      const hostname = new URL(venue.url).hostname.replace(/^www\./, '');
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
      return null;
    }
  }
  return null;
}
