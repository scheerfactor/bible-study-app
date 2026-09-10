import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: "Father's Business Bible Study", short_name: 'Bible Study',
    description: 'KJV Bible reading and lesson preparation.', start_url: '/', scope: '/',
    display: 'standalone', background_color: '#f8f5ed', theme_color: '#203e30',
    icons: [192, 512].map(size => ({ src: `/icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
  };
}
