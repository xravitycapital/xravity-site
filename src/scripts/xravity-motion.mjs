/*!
 * xravity-motion.js — scroll-triggered entrances that match the film.
 *
 *   <h2 data-xr="chars">每个时代  都从一件工具开始</h2>      per-character blur-in (Chinese)
 *   <p  data-xr="words" data-xr-delay="300">Every era begins with a single tool</p>   per-word (English)
 *   <h2 data-xr="slam">它为谁服务？</h2>                     punch-in
 *   <div class="xr-label" data-xr="track">…</div>           tracking label
 *   <div class="xr-rule" data-xr="rule"></div>               gold rule grows
 *   <div class="xr-card" data-xr="fade" data-xr-delay="120"></div>
 *
 * <script src="/xravity-motion.js"></script><script>XravityMotion.init()</script>
 */
function initMotion(root = document) {
  document.documentElement.classList.add('xr-motion-ready');
  const els = [...root.querySelectorAll('[data-xr]')];
  for (const el of els) {
    const kind = el.dataset.xr, delay = el.dataset.xrDelay;
    if (delay) el.style.setProperty('--d', delay + 'ms');
    if (kind === 'chars' || kind === 'words') split(el, kind);
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
    if (event.matches) { els.forEach(e=>e.classList.add('is-in')); io.disconnect(); }
  });
}

function split(el, kind) {
  if (el.dataset.xrSplit) return; el.dataset.xrSplit = '1';
  const text = el.textContent;
  if (/^H[1-6]$/.test(el.tagName)) el.setAttribute('aria-label', text.replace(/\s+/g, ' ').trim());
  el.textContent = '';
  // Paragraphs cannot be named with aria-label. Keep one genuine text node
  // for assistive technology, and hide only the animated visual fragments.
  const accessible = document.createElement('span');
  accessible.className = 'xr-sr-only'; accessible.textContent = text;
  el.appendChild(accessible);
  let i = 0;
  const append = (target, value) => {
    const parts = kind === 'chars' ? (value.match(/[A-Za-z0-9]+|[^A-Za-z0-9]/gu) || []) : value.split(/(\s+)/);
    for (const part of parts) {
      if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(part)); if (kind === 'chars') i++; continue; }
      // Latin words such as AI must never split into an orphan A / I.
      const host = kind === 'chars' && /^[A-Za-z0-9]{2,}$/.test(part) ? document.createElement('span') : target;
      if (host !== target) { host.className = 'xr-phrase'; target.appendChild(host); }
      for (const p of kind === 'chars' ? Array.from(part) : [part]) {
        const span = document.createElement('span'); span.className = kind === 'chars' ? 'xr-ch' : 'xr-wd';
        span.setAttribute('aria-hidden', 'true'); span.textContent = p; span.style.setProperty('--i', i++); host.appendChild(span);
      }
    }
  };
  if (kind === 'chars' && text.includes('  ')) {
    for (const phrase of text.split(/( {2,})/)) {
      if (/^\s+$/.test(phrase)) { el.appendChild(document.createTextNode(phrase)); continue; }
      const group = document.createElement('span'); group.className = 'xr-phrase'; el.appendChild(group); append(group, phrase);
    }
  } else append(el, text);
}

export { initMotion };
