import { cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';

export const PREVIEW_BRANCH = 'cloudflare-preview';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const previewOrigin = 'https://cloudflare-preview-xravity-site.xravity.workers.dev';

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

export async function preparePreview() {
  // Refuse a Cloudflare production-branch build: cutover is a separate decision.
  if (['main', 'master'].includes(process.env.WORKERS_CI_BRANCH)) throw Error('Preview configuration must not deploy from a production branch');
  const source = resolve(root, 'dist');
  const target = resolve(root, 'dist-cloudflare');
  // Fixed generated output only; never remove a source, repository, or user directory.
  await rm(target, { recursive:true, force:true });
  await mkdir(target);
  await cp(source, target, { recursive:true });
  const adminPath = resolve(target, 'admin/index.html');
  await writeFile(adminPath, previewAdmin(await readFile(adminPath, 'utf8')));
  const configPath = resolve(target, 'admin/config.yml');
  await writeFile(configPath, previewConfig(await readFile(configPath, 'utf8')));
  const indexPath = resolve(target, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  if (!index.includes('data-contact-endpoint="/"')) throw Error('Missing contact form endpoint');
  await writeFile(indexPath, index.replace('data-contact-endpoint="/"', 'data-contact-endpoint="/api/contact"'));
  await cp(resolve(root, 'cloudflare/headers'), resolve(target, '_headers'));
  await writeFile(resolve(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
  await writeFile(resolve(target, '__preview.json'), JSON.stringify({ mode:'preview', branch:PREVIEW_BRANCH, commit, builtAt:new Date().toISOString() }));
  console.log(`Prepared Cloudflare preview; CMS writes only to ${PREVIEW_BRANCH}. Production dist is unchanged.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await preparePreview();
