import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://coursecraft-planner.vercel.app'; // Replace with actual domain if known, or relative usage

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/private/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
