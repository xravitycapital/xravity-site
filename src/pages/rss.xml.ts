import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteData from '../data/site.json';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  return rss({
    title: 'Xravity Blog',
    description: siteData.site.description,
    site: siteData.site.url,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: new URL(`/blog/${post.slug}/`, siteData.site.url).toString(),
      categories: [post.data.category, ...(post.data.tags ?? [])].filter(Boolean),
    })),
    // Content can be authored in either language, so avoid labeling the whole
    // feed as one language. Readers still receive each title and excerpt intact.
    customData: '<ttl>60</ttl>',
  });
}
