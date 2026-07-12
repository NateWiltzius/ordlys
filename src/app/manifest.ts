import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ordlys – Norwegian Vocabulary',
    short_name: 'Ordlys',
    description: 'Learn Norwegian vocabulary with active recall and spaced repetition.',
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
      { name: 'Dashboard', short_name: 'Dashboard', url: '/dashboard' },
      { name: 'Decks', short_name: 'Decks', url: '/decks' },
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
