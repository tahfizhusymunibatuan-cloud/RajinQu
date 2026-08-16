import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RajinQu - PPTQ Al-Usymuni',
    short_name: 'RajinQu',
    description: 'Aplikasi Monitoring Kegiatan Santri Liburan PTQA Batuan Sumenep',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f766e',
    theme_color: '#115e59',
    orientation: 'portrait',
    icons: [
      {
        src: '/api/logo?type=green',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/api/logo?type=green',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
