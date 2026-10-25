import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=p=>readFile(new URL('../../'+p,import.meta.url),'utf8');

test('vision headings retain both complete locales with equivalent heading semantics',async()=>{
  const component=await source('src/components/Bilingual.astro');
  assert.match(component,/<Tag class="zh"[^>]*data-story-locale="zh"/);
  assert.match(component,/<Tag class="en"[^>]*data-story-locale="en"/);
  assert.doesNotMatch(component,/<p class="en"/);
  const css=await source('src/styles/locale.css');
  assert.match(css,/html:lang\(zh\) \[data-story-locale="en"\]/);
  assert.match(css,/html:lang\(en\) \[data-story-locale="zh"\]/);
  assert.match(css,/display: none !important/);
});

test('story labels, cold-future body, principles and calls to action have English text',async()=>{
  const html=await source('dist/vision/index.html');
  for(const phrase of ['Two futures','Our founding principle','your data and your choices are decided for you','STEP ONE · NOW','trap you in our products','Get in touch','Public beta now open','Watch the film']) assert.ok(html.includes(phrase),phrase);
  assert.match(html,/founding-lines founding-en[^>]*data-story-locale="en"/);
  assert.doesNotMatch(html,/联系我们 · Get in touch|观看愿景片 · Watch the film|两种未来 · TWO FUTURES/);
});

test('story uses the shared remembered language and updates page metadata when it changes',async()=>{
  const layout=await source('src/layouts/BaseLayout.astro');
  assert.match(layout,/localStorage.getItem\('xravity_lang'\) === 'en' \? 'en' : 'zh-CN'/);
  const script=await source('src/scripts/narrative.ts');
  assert.match(script,/document.addEventListener\('xravity:i18n', syncLocale\)/);
  assert.match(script,/Xravity Vision — AI that works for you/);
  assert.match(script,/meta\[property="og:locale"\]/);
});

test('home has a distinct product-led entrance without replacing the cinematic vision hero',async()=>{
  const home=await source('dist/index.html');const vision=await source('dist/vision/index.html');
  assert.match(home,/home-page/);assert.match(home,/hero-workbench/);assert.match(home,/home-index/);
  assert.match(home,/Workflow illustration/);assert.match(home,/href="#products" class="hero-cta"/);
  assert.doesNotMatch(home,/field-mark-dark|id="question"/);
  assert.match(vision,/field-mark-dark/);assert.doesNotMatch(vision,/hero-workbench/);
  const css=await source('src/styles/home.css');assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
  const hero=await source('src/components/Hero.astro');
  assert.match(hero,/StoryText zh=\{copy.zh.hero_title_1\} en=\{copy.hero_title_1\}/);
  assert.doesNotMatch(hero,/data-i18n="hero_title_[1-4]"/,'the first paint must not wait for a translation fetch');
});
