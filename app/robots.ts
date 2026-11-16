import type { MetadataRoute } from 'next';

const SITE = process.env.SITE_URL || 'https://breadmodular.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/checkout/'] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
