import { createFileRoute } from '@tanstack/react-router';
import HomeHud from '@/components/HomeHud';

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'DPM - Go! | Detroit Transit Map' },
      {
        name: 'description',
        content:
          'Explore Detroit People Mover stations and the QLINE corridor on an interactive downtown map.',
      },
      { property: 'og:title', content: 'DPM - Go! | Detroit Transit Map' },
      {
        property: 'og:description',
        content:
          'Explore Detroit People Mover stations and the QLINE corridor on an interactive downtown map.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: HomeRoute,
});

function HomeRoute() {
  return <HomeHud />;
}
