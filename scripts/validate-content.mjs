import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const translationPath = new URL('public/data/translations.json', root);

const requiredKeys = [
  'blog_search_label',
  'blog_search_placeholder',
  'blog_tools_label',
  'blog_filter_label',
  'blog_filter_group_label',
  'blog_filter_all',
  'blog_no_results',
  'related_posts',
  'read_article',
  'menu_open',
  'menu_close',
  'scroll_to_about',
  'copy_link',
];

const translations = JSON.parse(await readFile(translationPath, 'utf8'));

for (const locale of ['en', 'zh']) {
  const map = locale === 'en' ? translations : translations.zh;
  if (!map || typeof map !== 'object') {
    throw new Error(`Missing translation locale: ${locale}`);
  }

  for (const key of requiredKeys) {
    if (typeof map[key] !== 'string' || map[key].trim() === '') {
      throw new Error(`Missing ${locale} translation: ${key}`);
    }
  }
}

for (const requiredFile of [
  'src/content/config.ts',
  'src/pages/rss.xml.ts',
  'public/robots.txt',
]) {
  await access(new URL(requiredFile, root));
}

console.log(`Content checks passed: ${requiredKeys.length} UI keys × 2 locales.`);
