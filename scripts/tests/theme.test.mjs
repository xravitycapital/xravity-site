import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
const layout=await source('src/layouts/BaseLayout.astro');
const product=await source('src/pages/tiljot/index.astro');
test('all public layouts are dark only, even for a remembered light preference',()=>{
  for(const html of [layout,product]){
    assert.match(html,/<html[^>]*data-theme="dark"/);
    assert.match(html,/name="theme-color" content="#0B0B0E"/);
    assert.doesNotMatch(html,/getItem\('xravity_theme'\)|id="(?:themeToggle|tiljotThemeToggle)"/);
  }
  assert.doesNotMatch(layout,/styles\/light.css/);
});
test('home workbench keeps the pointer field and vision retains the orbital artwork',async()=>{
  const hero=await source('src/components/Hero.astro');
  assert.equal((hero.match(/<canvas class="brand-network"/g)||[]).length,1);
  assert.match(hero,/hero-workbench/);
  assert.doesNotMatch(hero,/field-mark-dark/);
  const visionHero=await source('src/components/NarrativeHero.astro');
  assert.match(visionHero,/class="field-mark field-mark-dark" src="\/brand\/xravity-mark\.svg"/);
  assert.doesNotMatch(hero,/field-mark-light/);
  assert.match(layout,/createBrandNetwork\(document\.getElementById\('particles'\)/);
});
test('mobile film is clear of floating utilities, back-to-top remains in the menu',async()=>{
  const css=await source('src/styles/global.css');const nav=await source('src/components/Nav.astro');
  assert.match(css,/@media \(max-width: 900px\) \{\s*#back-to-top \{ display: none !important;/);
  assert.match(nav,/mobile-page-controls[\s\S]*?data-i18n="back_to_top"/);
  assert.doesNotMatch(nav,/navThemeToggle/);
});
