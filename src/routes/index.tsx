import { createFileRoute } from '@tanstack/react-router';
import HomeHud from '@/components/HomeHud';

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'DPM - Go! | Detroit People Mover & QLINE Station Guide' },
      {
        name: 'description',
        content:
          'Explore Detroit People Mover and QLINE stations, estimated arrivals, nearby dining and walking directions with DPM - Go!, an independent downtown transit guide.',
      },
      { property: 'og:title', content: 'DPM - Go! | Detroit People Mover & QLINE Station Guide' },
      {
        property: 'og:description',
        content:
          'Explore Detroit People Mover and QLINE stations, estimated arrivals, nearby dining and walking directions with DPM - Go!, an independent downtown transit guide.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: 'og:url', content: 'https://dpmgo.app/' },
    ],
    links: [{ rel: 'canonical', href: 'https://dpmgo.app/' }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'DPM - Go!',
          url: 'https://dpmgo.app/',
          applicationCategory: 'TravelApplication',
          operatingSystem: 'Web browser',
          description:
            'Independent Detroit People Mover and QLINE station guide with estimated arrivals, nearby dining and walking directions. Vehicle positions are simulated, not live tracking.',
          isAccessibleForFree: true,
          publisher: { '@type': 'Organization', name: 'Motorcity Automated Systems' },
        }),
      },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  return <HomeHud />;
}
