import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteData from '../data/site.json';

export async function GET() {
  const posts = await getCollection('blog');
  posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  return rss({
    title: 'Xravity Blog',
    description: siteData.site.description,
    site: siteData.site.url,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/blog/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
