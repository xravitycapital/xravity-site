import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../../',import.meta.url);
const html=await readFile(new URL('dist/vision/index.html',root),'utf8');
const home=await readFile(new URL('dist/index.html',root),'utf8');
const script=await readFile(new URL('src/scripts/xravity-field.mjs',root),'utf8');
const translations=JSON.parse(await readFile(new URL('public/data/translations.json',root),'utf8'));

test('section 8 story keeps exact copy, order, declared field modes and five-step blueprint',()=>{
  const ids=['hero','vision','question','futures','principles','blueprint','products','founding-principle','open-standard','join'];
  let previous=-1;
  for(const id of ids){const index=html.indexOf(`id="${id}"`);assert.ok(index>previous,`section order: ${id}`);previous=index;}
  for(const text of ['让 AI 为你所用','AI that works for you','人类有史以来最强大的工具  正在诞生','它为谁服务？','Who will it serve?','一种未来  权力走向集中','另一种未来  权力走向分散','我们选择第二种未来','不依附巨头  自己做主','你的数据和生活  握在自己手里','一步一步  让 AI 真正为你所用','每个时代  都从一件工具开始','我们的  从手腕开始','我们永远不会','把你困在我们的产品里','而是一套开放标准','就像电子邮件  不属于任何一家公司  却属于每一个人','这是一生的使命','建设者','早期用户','合作伙伴']) assert.ok(html.includes(text),text);
  assert.match(html,/<section id="question"[^>]*data-field="silver"/);
  assert.match(html,/<section id="futures"[^>]*data-field="cold"/);
  assert.equal((html.match(/aria-current="step"/g)||[]).length,1);
  assert.match(html,/blueprint-step is-current[^>]*aria-current="step"[\s\S]*?01[\s\S]*?记录[\s\S]*?Capture/);
  for(const word of ['Memory','Agent','Secretary','Compute']) assert.ok(html.includes(word));
});

test('homepage hides placeholders without removing CMS resources, and all status copy agrees',async()=>{
  assert.doesNotMatch(home,/Astro Documentation|Decap CMS|alt="Avatar"/);
  const resources=await readFile(new URL('dist/resources/index.html',root),'utf8');
  assert.match(resources,/Astro Documentation/);assert.match(resources,/Decap CMS/);
  const site=JSON.parse(await readFile(new URL('src/data/site.json',root),'utf8'));
  assert.ok(site.gallery.photos.some(p=>p.caption==='Avatar'));
  const status='公测现已开启 · Public beta now open';
  assert.equal(translations.tiljot_status,status);assert.equal(translations.zh.tiljot_status,status);
  const product=await readFile(new URL('src/data/tiljot-copy.ts',root),'utf8');
  assert.equal((product.match(/status: '公测现已开启 · Public beta now open'/g)||[]).length,2);
  assert.doesNotMatch(product,/Preparing invitation testing|正在准备邀请内测/);
  assert.equal(translations.zh.contact_title,'联系我们');
  assert.equal(translations.zh.hero_tag,'让 AI 为你所用');
  assert.equal(translations.zh.back_to_top,'回到顶部');
  assert.equal(translations.zh.about_tag,'关于');
});

function setup(reduced=false){
  let id=0;const frames=new Map(),listeners=new Map(),docListeners=new Map(),motionListeners=new Map();
  const gradient={addColorStop(){}};
  const context=new Proxy({createRadialGradient:()=>gradient},{get:(target,key)=>target[key]||(()=>{})});
  const canvas={dataset:{},getContext:()=>context,getBoundingClientRect:()=>({width:390,height:844,left:0,top:0})};
  const motion={matches:reduced,addEventListener:(n,f)=>motionListeners.set(n,f),removeEventListener:n=>motionListeners.delete(n)};
  const document={hidden:false,documentElement:{dataset:{theme:'dark'}},addEventListener:(n,f)=>docListeners.set(n,f),removeEventListener:n=>docListeners.delete(n)};
  const sandbox={document,matchMedia:()=>motion,innerWidth:390,innerHeight:844,devicePixelRatio:3,performance:{now:()=>0},requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:i=>frames.delete(i),addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n),MutationObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{constructor(f){this.callback=f;}observe(){}disconnect(){}}};
  sandbox.window=sandbox;vm.createContext(sandbox);
  vm.runInContext(script.replace('export { XravityField };','this.Field = XravityField;'),sandbox);
  const field=new sandbox.Field(canvas,{mode:'cold',spacing:92});
  return {field,frames,listeners,docListeners,motion,motionListeners,document,canvas};
}

test('field blends cold to gold with a burst; DPR and pointer attraction stay bounded',()=>{
  const {field,canvas,listeners}=setup();
  assert.equal(field.dpr,1.5);
  field.burst();assert.equal(field.mode,'gold');assert.equal(field.burstAt,field.t);assert.equal(canvas.dataset.fieldMode,'gold');
  const burst=field.burstAt;field.setMode('silver');assert.equal(field.burstAt,burst);
  field.setMode('invalid');assert.equal(field.mode,'silver');
  listeners.get('pointermove')({clientX:180,clientY:300,pointerType:'mouse'});assert.equal(field.ptr.active,true);
  field.destroy();
});

test('hidden/offscreen fields cancel animation and cannot be restarted by the wrong observer',()=>{
  const {field,frames,document,docListeners}=setup();
  assert.equal(frames.size,1);
  field.intersection.callback([{isIntersecting:false}]);assert.equal(frames.size,0);
  document.hidden=false;docListeners.get('visibilitychange')();assert.equal(frames.size,0);
  field.intersection.callback([{isIntersecting:true}]);assert.equal(frames.size,1);
  document.hidden=true;docListeners.get('visibilitychange')();assert.equal(frames.size,0);
  field.intersection.callback([{isIntersecting:true}]);assert.equal(frames.size,0);
  field.destroy();assert.equal(docListeners.size,0);
});

test('reduced motion remains static and readable, including preference changes at runtime',()=>{
  const {field,frames,motion,motionListeners}=setup(true);
  field.burst();assert.equal(field.mode,'gold');assert.equal(frames.size,0);assert.equal(field.w.gold,1);
  motion.matches=false;motionListeners.get('change')();assert.equal(frames.size,1);
  motion.matches=true;motionListeners.get('change')();assert.equal(frames.size,0);
  field.destroy();
});

test('animated paragraphs retain real readable text and homepage has a main landmark',async()=>{
  const motion=await readFile(new URL('src/scripts/xravity-motion.mjs',root),'utf8');
  assert.match(motion,/if \(\/\^H\[1-6\]\$\/.test\(el.tagName\)\) el.setAttribute\('aria-label'/);
  assert.match(motion,/accessible.className = 'xr-sr-only'/);
  assert.match(motion,/accessible.textContent = text/);
  assert.match(html,/<main>/);
});

test('homepage retains its original composition, with story on its own route',()=>{
  assert.match(home,/class="hero-headline"/);
  assert.doesNotMatch(home,/id="question"|id="blueprint"|narrative-page/);
  assert.match(home,/href="\/vision\/"/);
  assert.match(html,/narrative-page/);
});

test('Chinese animation preserves phrase boundaries and never splits AI across lines',async()=>{
  const source=await readFile(new URL('src/scripts/xravity-motion.mjs',root),'utf8');
  const element=tag=>({tagName:tag,dataset:{},textContent:'',children:[],style:{setProperty(){}},setAttribute(){},appendChild(node){this.children.push(node);}});
  const sandbox={document:{createElement:tag=>element(tag.toUpperCase()),createTextNode:text=>({textContent:text})}};
  vm.createContext(sandbox);vm.runInContext(source.replace('export { initMotion };','this.splitText=split;'),sandbox);
  const heading=element('H2');heading.textContent='一步一步  让 AI 真正为你所用';sandbox.splitText(heading,'chars');
  const phrases=heading.children.filter(x=>x.className==='xr-phrase');assert.equal(phrases.length,2);
  const latin=phrases[1].children.find(x=>x.className==='xr-phrase');assert.ok(latin);
  assert.equal(latin.children.map(x=>x.textContent).join(''),'AI');
});
