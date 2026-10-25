import { XravityField } from './xravity-field.mjs';
import { initMotion } from './xravity-motion.mjs';

export function initNarrative() {
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
