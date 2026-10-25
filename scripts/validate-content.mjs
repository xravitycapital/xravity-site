import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const translationPath = new URL('public/data/translations.json', root);
const adminConfigPath = new URL('public/admin/config.yml', root);
const netlifyConfigPath = new URL('netlify.toml', root);
const deployGuidePath = new URL('DEPLOY.md', root);

const requiredKeys = [
  'products_tag',
  'products_title',
  'tiljot_name',
  'tiljot_status',
  'tiljot_tagline',
  'tiljot_description',
  'tiljot_visit',
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
  'scroll_to_principles',
  'copy_link',
  'comments_tag',
  'comments_title',
  'comments_intro',
  'comments_github',
  'comments_privacy',
  'comments_loading',
  'comments_retry',
  'comments_error',
  'field_heading',
  'field_footer',
  'vision_tag',
  'vision_title',
  'vision_intro',
  'vision_link',
  'vision_video_label',
  'vision_download',
  'vision_credits',
  'vision_accessibility',
  'blog_page_tag', 'blog_page_title', 'blog_page_intro', 'back_to_blog',
  'resources_page_tag', 'resources_page_title', 'resources_page_intro',
  'resources_search_label', 'resources_search_placeholder',
  'resources_filter_label', 'resources_no_results',
];

const translations = JSON.parse(await readFile(translationPath, 'utf8'));
const adminConfig = await readFile(adminConfigPath, 'utf8');
const netlifyConfig = await readFile(netlifyConfigPath, 'utf8');
const adminPage = await readFile(new URL('src/pages/admin/index.astro', root), 'utf8');
const deployGuide = await readFile(deployGuidePath, 'utf8');

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
  if ((map.vision_title.match(/class="title-line"/g) || []).length !== 2) {
    throw new Error(`Vision title must keep two complete phrases: ${locale}`);
  }
}

for (const requiredFile of [
  'src/content/config.ts',
  'src/pages/rss.xml.ts',
  'public/robots.txt',
  'src/pages/admin/index.astro',
  'public/admin/config.yml',
  'public/admin/preview.js',
  'public/admin/preview.css',
  'public/admin/admin.js',
  'public/admin/shell.css',
  'src/styles/content.css',
  'src/scripts/analytics.mjs',
  'public/admin/robots.txt',
  'DEPLOY.md',
  'public/brand/favicon.svg',
  'public/brand/xravity-lockup-horizontal.svg',
  'public/brand/xravity-mark.svg',
  'public/images/brand/xravity-og-image.jpg',
  'public/film/xravity-vision-poster.jpg',
  'public/film/xravity-vision-web.mp4',
]) {
  await access(new URL(requiredFile, root));
}

const adminConfigChecks = [
  ['Git Gateway backend', /name:\s*git-gateway/],
  ['main publish branch', /branch:\s*main/],
  ['resource relation widget', /widget:\s*"relation"/],
  ['rich text widget', /widget:\s*"richtext"/],
  ['Chinese editor locale', /locale:\s*zh_Hans/],
  ['sanitized article preview', /sanitize_preview:\s*true/],
  ['date-only picker', /date_format:\s*"YYYY-MM-DD"/],
  ['commit message templates', /commit_messages:[\s\S]*uploadMedia:/],
];

for (const [label, check] of adminConfigChecks) {
  const matches = check instanceof RegExp ? check.test(adminConfig) : check;
  if (!matches) throw new Error(`Admin config check failed: ${label}`);
}

if (/publish_mode:\s*editorial_workflow/.test(adminConfig)) {
  throw new Error('Admin config check failed: editorial workflow is still enabled');
}

if (!/from\s*=\s*"\/admin\/"[\s\S]*?to\s*=\s*"\/admin\/index\.html"/.test(netlifyConfig)) {
  throw new Error('Admin config check failed: /admin/ redirect');
}

if (!/for\s*=\s*"\/admin\/\*"[\s\S]*?Cache-Control\s*=\s*"no-store"[\s\S]*?X-Robots-Tag\s*=\s*"noindex/.test(netlifyConfig)) {
  throw new Error('Admin config check failed: no-store/noindex headers');
}

for (const requiredGuideText of ['Invite only', 'two-factor authentication', 'Future GitHub Backend Migration']) {
  if (!deployGuide.includes(requiredGuideText)) {
    throw new Error(`Admin config check failed: DEPLOY.md is missing "${requiredGuideText}"`);
  }
}

if (!adminPage.includes('id="nc-root"')) {
  throw new Error('Admin config check failed: Decap mount point #nc-root');
}
if (adminPage.includes('<Analytics') || adminPage.includes('gtag(')) {
  throw new Error('Admin must not load visitor analytics');
}
const adminScript = await readFile(new URL('public/admin/admin.js', root), 'utf8');
if (!adminScript.includes('CMS_MANUAL_INIT = true') || !adminScript.includes('decap-cms@3.17.1/')) {
  throw new Error('Admin requires manual initialization and a pinned CMS version');
}

const vision = await readFile(new URL('src/components/Vision.astro', root), 'utf8');
// Editorial display copy is intentionally punctuation-free in Chinese.
// Body/article copy is NOT stripped; its punctuation is necessary for reading.
for (const key of ['hero_title_1', 'hero_title_2', 'hero_title_3', 'hero_title_4',
  'vision_title', 'principles_title', 'products_title', 'about_title',
  'tiljot_tagline', 'field_heading', 'field_footer', 'footer_motto',
  'blog_page_title', 'resources_page_title']) {
  const text = translations.zh[key].replace(/<[^>]*>/g, '');
  if (/[，。]/.test(text)) throw new Error(`Chinese display copy should not use commas or full stops: ${key}`);
}
if (!/preload="none"/.test(vision) || /<video[^>]*autoplay/.test(vision)) {
  throw new Error('Vision film must load on demand and must not autoplay');
}
if (!vision.includes('Scott Buckley') || !vision.includes('CC BY 4.0')) {
  throw new Error('Vision film attribution is missing');
}

console.log(`Content checks passed: ${requiredKeys.length} UI keys × 2 locales; Admin config checks passed.`);
