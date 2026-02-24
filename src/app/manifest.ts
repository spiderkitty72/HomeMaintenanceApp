import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MaintenanceApp',
        short_name: 'Maintenance',
        description: 'Track your assets and maintenance schedules',
        start_url: '/',
        id: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
            {
                src: '/icons/icon-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
            },
            {
                src: '/icons/icon-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
            },
        ],
    }
}
