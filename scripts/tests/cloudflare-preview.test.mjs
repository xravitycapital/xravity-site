import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { previewAdmin, previewConfig, productionAdmin, buildMode, cloudflareHeaders, cloudflareHtml } from '../prepare-cloudflare.mjs';

test('Cloudflare main builds production while preview builds cannot promote themselves', () => {
  assert.equal(buildMode({ WORKERS_CI_BRANCH:'main' }), 'production');
  assert.equal(buildMode({ WORKERS_CI_BRANCH:'cloudflare-preview' }), 'preview');
  assert.equal(buildMode({}), 'preview');
  assert.equal(buildMode({ CLOUDFLARE_BUILD_MODE:'production' }), 'production');
  assert.throws(() => buildMode({ WORKERS_CI_BRANCH:'other' }));
  assert.throws(() => buildMode({ WORKERS_CI_BRANCH:'cloudflare-preview', CLOUDFLARE_BUILD_MODE:'production' }));
  assert.throws(() => buildMode({ CLOUDFLARE_BUILD_MODE:'invalid' }));
});

test('production admin retains main publishing and same-origin existing Identity', () => {
  const result = productionAdmin('<body data-identity-url="https://xravity.xyz/.netlify/identity"><a href="https://app.netlify.com/projects/xravity/deploys">Netlify 生产发布状态</a><p>提交至 main，由自动构建发布</p>');
  assert.match(result, /data-identity-url="\/.netlify\/identity"/);
  assert.match(result, /提交至 main/);
  assert.match(result, /dash.cloudflare.com/);
  assert.doesNotMatch(result, /data-preview-branch|app.netlify.com|Netlify 生产/);
  assert.throws(() => productionAdmin('no configuration'));
});

test('public production is indexable but admin and all preview pages are excluded', async () => {
  const source = await readFile(new URL('../../cloudflare/headers', import.meta.url), 'utf8');
  const production = cloudflareHeaders(source, 'production');
  assert.doesNotMatch(production.split('\n\n')[0], /noindex/);
  assert.match(production, /https:\/\/:version\.:subdomain\.workers\.dev\/\*\n  X-Robots-Tag: noindex/);
  assert.match(production, /\/admin\n  X-Robots-Tag: noindex/);
  assert.match(cloudflareHeaders(source, 'preview'), /^\/\*\n  X-Robots-Tag: noindex/);
});

test('admin no-store policy does not merge with an explicit global public-cache policy', async () => {
  const source = await readFile(new URL('../../cloudflare/headers', import.meta.url), 'utf8');
  assert.doesNotMatch(source.split('\n\n')[0], /Cache-Control/);
  assert.match(source, /\/admin\n[^\n]*\n  Cache-Control: no-store/);
  assert.match(source, /\/admin\/\*\n[^\n]*\n  Cache-Control: no-store/);
});

test('production routing stays limited to the public apex hostname', async () => {
  const source = await readFile(new URL('../../wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(source, /"pattern": "xravity.xyz\/\*", "zone_name": "xravity.xyz"/);
  assert.doesNotMatch(source, /"pattern": "\*\.xravity.xyz/);
});

test('every contact form is adapted, not just the first homepage form', () => {
  const source = '<form data-contact-endpoint="/"></form><form data-contact-endpoint="/"></form>';
  assert.equal(cloudflareHtml(source), source.replaceAll('endpoint="/"', 'endpoint="/api/contact"'));
});

test('preview CMS never saves to main and production source remains unchanged', async () => {
  const source = await readFile(new URL('../../public/admin/config.yml', import.meta.url), 'utf8');
  const preview = previewConfig(source);
  assert.match(source, /^  branch: main$/m);
  assert.match(preview, /^  branch: cloudflare-preview$/m);
  assert.doesNotMatch(preview, /直接进入 main|https:\/\/xravity.xyz/);
  assert.throws(() => previewConfig(source.replace('branch: main', 'branch: other')));
});

test('preview admin uses same-origin auth and clearly identifies its isolated branch', () => {
  const output = previewAdmin('<body data-identity-url="https://xravity.xyz/.netlify/identity"><header class="admin-bar"></header><p>提交至 main，由自动构建发布</p><a href="https://github.com/xravitycapital/xravity-site/commits/main/">记录</a>');
  assert.match(output, /data-identity-url="\/.netlify\/identity"/);
  assert.match(output, /data-preview-branch="cloudflare-preview"/);
  assert.match(output, /正式网站不受影响/);
  assert.doesNotMatch(output, /commits\/main\/|提交至 main/);
  assert.throws(() => previewAdmin('<body>missing identity configuration'));
});
