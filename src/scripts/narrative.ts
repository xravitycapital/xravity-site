import { XravityField } from './xravity-field.mjs';
import { initMotion } from './xravity-motion.mjs';

export function initNarrative() {
  const syncLocale = () => {
    const english = document.documentElement.lang.startsWith('en');
    const title = english ? 'Xravity Vision — AI that works for you' : 'Xravity 愿景 — 让 AI 为你所用';
    const description = english ? 'More capable, more independent, more secure. Our vision for AI that works for you.' : '让 AI 为你所用  更有能力  更独立  更安全';
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', english ? 'en_US' : 'zh_CN');
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  };
  syncLocale();
  document.addEventListener('xravity:i18n', syncLocale);
  const canvas = document.getElementById('particles') as HTMLCanvasElement;
  if (!canvas?.getContext('2d')) return;
  const field = new XravityField(canvas, {mode:'cold',intensity:.6,spacing:92});
  field.burst();
  initMotion();
  const visible = new Set<HTMLElement>();
  if ('IntersectionObserver' in window) {
    // The demo's 50% threshold can never fire for a tall mobile section.
    // Follow the section crossing the middle reading band instead.
    const modes = new IntersectionObserver(entries => {
      entries.forEach(entry=>entry.isIntersecting ? visible.add(entry.target as HTMLElement) : visible.delete(entry.target as HTMLElement));
      const active = [...visible].sort((a,b)=>{
        const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
        return Math.abs((ar.top+ar.bottom)/2-innerHeight/2)-Math.abs((br.top+br.bottom)/2-innerHeight/2);
      })[0];
      if (active) field.setMode(active.dataset.field);
    }, {rootMargin:'-35% 0px -35% 0px',threshold:0});
    document.querySelectorAll<HTMLElement>('[data-field]').forEach(section=>modes.observe(section));
  }
}
