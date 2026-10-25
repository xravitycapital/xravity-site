import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { previewAdmin, previewConfig } from '../prepare-cloudflare.mjs';

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
