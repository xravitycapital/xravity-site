import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldTrack, linkEvent, startAnalytics } from '../../src/scripts/analytics.mjs';

test('only production public pages are tracked; browser privacy signals take precedence', () => {
  for (const hostname of ['xravity.xyz', 'www.xravity.xyz']) {
    assert.equal(shouldTrack({ hostname }), true);
    for (const pathname of ['/admin', '/admin/', '/admin/index.html']) {
      assert.equal(shouldTrack({ hostname, pathname }), false);
    }
    assert.equal(shouldTrack({ hostname, doNotTrack: '1' }), false);
    assert.equal(shouldTrack({ hostname, doNotTrack: 'yes' }), false);
    assert.equal(shouldTrack({ hostname, globalPrivacyControl: true }), false);
  }
  for (const hostname of ['localhost', '127.0.0.1', 'preview.workers.dev', 'xravity.xyz.evil.test']) {
    assert.equal(shouldTrack({ hostname }), false);
  }
});

test('file clicks and password-gated download entries have different meanings', () => {
  assert.deepEqual(linkEvent('/film/xravity-vision-web.mp4?token=private#fragment'), {
    name: 'download_click', params: { link_url: 'https://xravity.xyz/film/xravity-vision-web.mp4', file_extension: 'mp4' },
  });
  assert.deepEqual(linkEvent('https://tiljot-beta-downloads.netlify.app/?password=private', {
    explicit: 'download_entry_click', itemId: 'tiljot-mac-beta',
  }), { name: 'download_entry_click', params: { link_url: 'https://tiljot-beta-downloads.netlify.app/', item_id: 'tiljot-mac-beta' } });
  assert.equal(linkEvent('/ordinary-page/'), null);
  assert.equal(linkEvent('javascript:alert(1)', { explicit: 'resource_open' }), null);
  assert.equal(linkEvent('mailto:hello@xravity.com', { download: true }), null);
  assert.equal(linkEvent('https://[broken'), null);
  assert.equal(linkEvent('/file', { download: true }).name, 'download_click');
  assert.equal(linkEvent('/file.ZIP').params.file_extension, 'zip');
  assert.equal(linkEvent('/docs', { explicit: 'resource_open', itemId: 'x'.repeat(110) }).params.item_id.length, 100);
  assert.equal(linkEvent('/docs', { explicit: 'arbitrary_event' }), null);
});

test('GA4 configuration and delegated events never forward query strings or fragments', () => {
  const previous = new Map(['window', 'document', 'location', 'navigator', 'Element'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const scripts = [], listeners = [];
  class Anchor {
    dataset = { analyticsEvent: 'resource_open', analyticsId: 'astro' };
    closest() { return this; }
    getAttribute() { return '/docs?secret=private#token'; }
    hasAttribute() { return false; }
  }
  try {
    const fixtures = {
      window: {}, location: { hostname: 'xravity.xyz', pathname: '/blog/', origin: 'https://xravity.xyz', href: 'https://xravity.xyz/blog/?secret=private#token' },
      navigator: {}, Element: Anchor,
      document: { referrer: 'https://source.test/ref?secret=private#token', createElement: () => ({}), head: { appendChild: script => scripts.push(script) }, addEventListener: (_, listener) => listeners.push(listener) },
    };
    for (const [key, value] of Object.entries(fixtures)) Object.defineProperty(globalThis, key, { value, configurable: true });
    startAnalytics('invalid'); assert.equal(scripts.length, 0);
    startAnalytics('G-60NSLRCLLD');
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].async, true);
    const config = Array.from(window.dataLayer[1]);
    assert.equal(config[0], 'config');
    assert.equal(config[2].page_location, 'https://xravity.xyz/blog/');
    assert.equal(config[2].page_referrer, 'https://source.test/ref');
    assert.equal(config[2].allow_google_signals, false);
    listeners[0]({ target: {} }); assert.equal(window.dataLayer.length, 2);
    listeners[0]({ target: new Anchor() });
    assert.deepEqual(Array.from(window.dataLayer[2]), ['event', 'resource_open', { link_url: 'https://xravity.xyz/docs', item_id: 'astro', send_to: 'G-60NSLRCLLD' }]);
    assert.equal(JSON.stringify(window.dataLayer).includes('private'), false);
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
