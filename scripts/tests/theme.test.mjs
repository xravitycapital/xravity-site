import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const global=await readFile(new URL('../../src/styles/global.css',import.meta.url),'utf8');
const light=await readFile(new URL('../../src/styles/light.css',import.meta.url),'utf8');
const layout=await readFile(new URL('../../src/layouts/BaseLayout.astro',import.meta.url),'utf8');
const root=global.slice(global.indexOf(':root {'),global.indexOf('[data-theme="dark"]'));
const color=name=>root.match(new RegExp(`--${name}:\\s*(#[a-f0-9]{6})`,'i'))?.[1];
function luminance(hex) {
  const channels=hex.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function contrast(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}

test('light text and accent palette retains readable normal-text contrast', () => {
  for(const name of ['text','text-muted','text-light','accent']) {
    for(const surface of ['bg','bg-alt','bg-card']) {
      assert.ok(contrast(color(name),color(surface))>=4.5,`${name} on ${surface} must reach 4.5:1`);
    }
  }
  assert.ok(contrast('#ffffff','#192b43')>=7,'primary CTA keeps strong text contrast');
});

test('light-only styles cannot restyle dark selectors or remove the particle surface', () => {
  assert.doesNotMatch(light,/data-theme="dark"|display:\s*none|animation:\s*none/);
  for(const selector of light.matchAll(/^([^@/*}\s][^{]+)\{/gm)) {
    assert.match(selector[1],/^html\[data-theme="light"\]/);
  }
  assert.match(layout,/createBrandNetwork\(document\.getElementById\('particles'\)/);
  assert.match(light,/filter: brightness\(0\) saturate\(100%\)/);
  assert.match(layout,/theme-color-meta.*#f7f8fa/);
});

test('open light hero preserves the source mark geometry and the live canvas', async () => {
  const original=await readFile(new URL('../../public/brand/xravity-mark.svg',import.meta.url),'utf8');
  const adapted=await readFile(new URL('../../public/brand/xravity-mark-light.svg',import.meta.url),'utf8');
  const geometry=svg=>svg.replace(/#[a-f0-9]{6}/gi,'#COLOR')
    .replace(/(stop-opacity|stroke-opacity)="[^"]*"/g,'$1="OPACITY"').trim();
  assert.equal(geometry(adapted),geometry(original),'light mark may change only colors and glow opacity');
  const hero=await readFile(new URL('../../src/components/Hero.astro',import.meta.url),'utf8');
  assert.equal((hero.match(/<canvas class="brand-network"/g)||[]).length,1);
  assert.match(hero,/class="field-mark field-mark-dark" src="\/brand\/xravity-mark\.svg"/);
  assert.match(hero,/class="field-mark field-mark-light" src="\/brand\/xravity-mark-light\.svg"/);
  const field=light.match(/html\[data-theme="light"\] \.brand-field \{([\s\S]*?)\n\}/)?.[1]||'';
  assert.match(field,/border-color: transparent/);
  assert.match(field,/box-shadow: none/);
  assert.match(field,/background: radial-gradient/);
  assert.doesNotMatch(field,/url\(/);
  assert.match(light,/mask-image: radial-gradient/);
});
