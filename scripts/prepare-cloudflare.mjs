import { cp, readFile, writeFile, rm, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';

export const PREVIEW_BRANCH = 'cloudflare-preview';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const previewOrigin = 'https://cloudflare-preview-xravity-site.xravity.workers.dev';
const deploymentsUrl = 'https://dash.cloudflare.com/5efe188fcbc8bfe8dc54de29cb77a35a/workers/services/view/xravity-site/production/deployments';

export function buildMode(env = process.env) {
  const branch = env.WORKERS_CI_BRANCH;
  if (branch === 'main') return 'production';
  if (branch && branch !== PREVIEW_BRANCH) throw Error(`Unsupported Cloudflare build branch: ${branch}`);
  if (env.CLOUDFLARE_BUILD_MODE && !['preview', 'production'].includes(env.CLOUDFLARE_BUILD_MODE)) throw Error('Invalid Cloudflare build mode');
  if (branch && env.CLOUDFLARE_BUILD_MODE === 'production') throw Error('Preview branch must not build production assets');
  return env.CLOUDFLARE_BUILD_MODE || 'preview';
}

export function productionAdmin(source) {
  if (!source.includes('data-identity-url="https://xravity.xyz/.netlify/identity"')) throw Error('Unexpected admin identity URL');
  return source.replace('data-identity-url="https://xravity.xyz/.netlify/identity"', 'data-identity-url="/.netlify/identity"')
    .replaceAll('https://app.netlify.com/projects/xravity/deploys', deploymentsUrl)
    .replaceAll('Netlify 生产发布状态', 'Cloudflare 生产发布状态');
}

export function cloudflareHtml(source) {
  return source.replaceAll('data-contact-endpoint="/"', 'data-contact-endpoint="/api/contact"');
}

export function cloudflareHeaders(source, mode) {
  return mode === 'preview' ? source.replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n') : source;
}

export function previewConfig(source) {
  if (!/^  branch: main$/m.test(source)) throw Error('Unexpected CMS branch; refusing to rewrite');
  return source.replace(/^  branch: main$/m, `  branch: ${PREVIEW_BRANCH}`)
    .replaceAll('直接进入 main', `只进入预览分支 ${PREVIEW_BRANCH}，不影响正式站`)
    .replaceAll('Authenticated saves commit directly to main.', 'Authenticated saves commit only to the preview branch.')
    .replaceAll('https://xravity.xyz', previewOrigin);
}

export function previewAdmin(source) {
  if (!source.includes('data-identity-url="https://xravity.xyz/.netlify/identity"')) throw Error('Unexpected admin identity URL');
  return source
    .replace('data-identity-url="https://xravity.xyz/.netlify/identity"', `data-identity-url="/.netlify/identity" data-preview-branch="${PREVIEW_BRANCH}"`)
    .replace('<header ', '<aside class="preview-notice" role="note" style="padding:12px 20px;background:#172d40;color:#fff;text-align:center;font:600 14px/1.6 sans-serif">Cloudflare 预览验证 · 保存仅更新预览分支 · 正式网站不受影响</aside><header ')
    .replaceAll('提交至 main，由自动构建发布', `提交至 ${PREVIEW_BRANCH}，仅更新预览版本`)
    .replaceAll('/commits/main/', `/commits/${PREVIEW_BRANCH}/`)
    .replace('https://app.netlify.com/projects/xravity/deploys', 'https://dash.cloudflare.com/5efe188fcbc8bfe8dc54de29cb77a35a/workers/services/view/xravity-site/production/deployments')
    .replaceAll('生产发布状态', 'Cloudflare 预览构建')
    .replaceAll('Netlify 生产发布状态', 'Cloudflare 预览构建状态')
    .replace('保存即提交，草稿不会公开', '保存只更新预览分支，草稿不显示');
}

export async function prepareCloudflare() {
  const mode = buildMode();
  const source = resolve(root, 'dist');
  const target = resolve(root, 'dist-cloudflare');
  // Fixed generated output only; never remove a source, repository, or user directory.
  await rm(target, { recursive:true, force:true });
  await mkdir(target);
  await cp(source, target, { recursive:true });
  const adminPath = resolve(target, 'admin/index.html');
  await writeFile(adminPath, (mode === 'preview' ? previewAdmin : productionAdmin)(await readFile(adminPath, 'utf8')));
  const configPath = resolve(target, 'admin/config.yml');
  if (mode === 'preview') await writeFile(configPath, previewConfig(await readFile(configPath, 'utf8')));
  // Both the homepage and vision page contain a contact form. Rewrite every
  // generated HTML page, while leaving the original Netlify dist untouched.
  async function rewriteHtml(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await rewriteHtml(path);
      else if (entry.name.endsWith('.html')) await writeFile(path, cloudflareHtml(await readFile(path, 'utf8')));
    }
  }
  await rewriteHtml(target);
  await writeFile(resolve(target, '_headers'), cloudflareHeaders(await readFile(resolve(root, 'cloudflare/headers'), 'utf8'), mode));
  if (mode === 'preview') await writeFile(resolve(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
  const release = JSON.stringify({ mode, branch:mode === 'production' ? 'main' : PREVIEW_BRANCH, commit, builtAt:new Date().toISOString() });
  await writeFile(resolve(target, '__release.json'), release);
  if (mode === 'preview') await writeFile(resolve(target, '__preview.json'), release);
  console.log(`Prepared Cloudflare ${mode}; CMS branch: ${mode === 'production' ? 'main' : PREVIEW_BRANCH}. Original Netlify dist is unchanged.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prepareCloudflare();
