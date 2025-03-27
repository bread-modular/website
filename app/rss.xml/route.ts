import { generateRssFeed } from '@/lib/blog';

export async function GET() {
  const rss = await generateRssFeed();
  
  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
} 