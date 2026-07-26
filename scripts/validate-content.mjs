import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const translationPath = new URL('public/data/translations.json', root);
const adminConfigPath = new URL('public/admin/config.yml', root);
const netlifyConfigPath = new URL('netlify.toml', root);
const deployGuidePath = new URL('DEPLOY.md', root);

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
}

for (const requiredFile of [
  'src/content/config.ts',
  'src/pages/rss.xml.ts',
  'public/robots.txt',
  'src/pages/admin/index.astro',
  'public/admin/config.yml',
  'public/admin/preview.js',
  'public/admin/preview.css',
  'public/admin/robots.txt',
  'DEPLOY.md',
]) {
  await access(new URL(requiredFile, root));
}

const adminConfigChecks = [
  ['Git Gateway backend', /name:\s*git-gateway/],
  ['main publish branch', /branch:\s*main/],
  ['resource relation widget', /widget:\s*"relation"/],
  ['rich text widget', /widget:\s*"richtext"/],
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

console.log(`Content checks passed: ${requiredKeys.length} UI keys × 2 locales; Admin config checks passed.`);
