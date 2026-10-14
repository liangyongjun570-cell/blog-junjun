import type { MetadataRoute } from 'next';
import { siteConfig } from '../siteConfig';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.navTitle || siteConfig.authorName,
    description: siteConfig.bio,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#ec4899',
    icons: [
      { src: '/avatar.jpg', sizes: '192x192', type: 'image/jpeg' },
      { src: '/avatar.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
  };
}
