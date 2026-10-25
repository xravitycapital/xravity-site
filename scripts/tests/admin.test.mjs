import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../public/admin/admin.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup({ user = null, expired = false, missingIdentity = false, failScripts = false, failPrimary = false, render = true, alreadyInitialized = false } = {}) {
  const elements = new Map();
  const timers = new Map(), loaded = [], identityEvents = {};
  let timerId = 0, cmsInits = 0, settingsCalls = 0;
  const el = id => {
    if (!elements.has(id)) elements.set(id, { hidden: false, disabled: false, textContent: '', dataset: {}, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; }, querySelector() { return render && cmsInits ? {} : null; } });
    return elements.get(id);
  };
  const identity = {
    on: (name, fn) => { identityEvents[name] = fn; },
    init: options => { assert.equal(options.APIUrl, 'https://xravity.xyz/.netlify/identity'); if (!alreadyInitialized) identityEvents.init(user); },
    setLocale: locale => assert.equal(locale, 'zhCN'),
    currentUser: () => user, refresh: async () => { if (expired) throw Error('expired'); },
    close() {}, open() {}, logout: () => identityEvents.logout(),
  };
  const context = {
    document: { body: { dataset: { identityUrl: 'https://xravity.xyz/.netlify/identity' } }, getElementById: el, createElement: () => ({ remove() {} }), head: { appendChild(script) {
      loaded.push(script.src);
      if (failScripts || (failPrimary && script.src.includes('unpkg.com'))) script.onerror();
      else {
        if (script.src.includes('decap-cms')) context.window.CMS = { init: () => { assert.equal(context.window.CMS_MANUAL_INIT, true); cmsInits++; } };
        script.onload();
      }
    } } },
    window: { netlifyIdentity: missingIdentity ? undefined : identity },
    location: { hash: '', reload() {} },
    setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; },
    clearTimeout: id => timers.delete(id), AbortController,
    fetch: async () => { settingsCalls++; return { ok: true, json: async () => ({ disable_signup: true }) }; },
    MutationObserver: class { observe() {} disconnect() {} },
  };
  vm.runInNewContext(source, context);
  return { el, loaded, timers, identityEvents, get cmsInits() { return cmsInits; }, get settingsCalls() { return settingsCalls; } };
}

test('anonymous visitors never load CMS or receive the authenticated overview', async () => {
  const app = setup(); await tick();
  assert.equal(app.el('adminWorkspace').hidden, true);
  assert.equal(app.el('login-prompt').hidden, false);
  assert.equal(app.el('loginBtn').disabled, false);
  await app.el('editorBtn').handlers.click();
  assert.equal(app.loaded.length, 0);
  assert.equal(app.settingsCalls, 0);
});

test('failed identity loading produces a visible retry state', async () => {
  const app = setup({ missingIdentity: true, failScripts: true }); await tick();
  assert.equal(app.el('retryBtn').hidden, false);
  assert.match(app.el('status-text').textContent, /未能加载/);
  assert.equal(app.el('editorShell').hidden, true);
});

test('expired sessions cannot open the editor', async () => {
  const app = setup({ user: {}, expired: true }); await tick();
  assert.equal(app.el('adminWorkspace').hidden, true);
  assert.match(app.el('status-text').textContent, /会话已失效/);
  await app.el('editorBtn').handlers.click(); assert.equal(app.cmsInits, 0);
});

test('CDN auto-initialization cannot leave an existing session waiting for an old init event', async () => {
  const app = setup({ user: {}, alreadyInitialized: true }); await tick();
  assert.equal(app.el('adminWorkspace').hidden, false);
  assert.equal(app.el('login-prompt').hidden, true);
});

test('valid session shows maintenance and can recover from primary CMS CDN failure', async () => {
  const app = setup({ user: {}, failPrimary: true }); await tick();
  assert.equal(app.el('adminWorkspace').hidden, false);
  assert.match(app.el('security-status').textContent, /已核实：仅邀请/);
  await app.el('editorBtn').handlers.click();
  assert.equal(app.cmsInits, 1);
  assert.equal(app.el('editorShell').hidden, false);
  assert.equal(app.loaded.some(url => url.includes('cdn.jsdelivr.net/npm/decap-cms@3.17.1/')), true);
  app.el('overviewBtn').handlers.click();
  assert.equal(app.el('adminWorkspace').hidden, false);
  await app.el('editorBtn').handlers.click();
  assert.equal(app.cmsInits, 1, 'returning to the editor must preserve its mounted state');
});

test('CMS render timeout keeps the maintenance overview available', async () => {
  const app = setup({ user: {}, render: false }); await tick();
  const loading = app.el('editorBtn').handlers.click(); await tick();
  const timer = [...app.timers.values()].find(item => item.ms === 20000);
  assert.ok(timer); timer.fn(); await loading;
  assert.equal(app.el('adminWorkspace').hidden, false);
  assert.equal(app.el('editorShell').hidden, true);
  assert.equal(app.el('editorBtn').disabled, false);
  assert.match(app.el('editor-status').textContent, /暂未就绪/);
});
