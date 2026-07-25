import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ordlys – Spaced Repetition Flashcards',
    short_name: 'Ordlys',
    description: 'Learn any subject with active recall and spaced repetition.',
    id: '/',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f766e',
    orientation: 'portrait-primary',
    categories: ['education', 'productivity'],
    lang: 'en',
    shortcuts: [
      { name: 'Today', short_name: 'Today', url: '/dashboard' },
      { name: 'Library', short_name: 'Library', url: '/decks' },
      { name: 'Discover', short_name: 'Discover', url: '/discover' },
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
