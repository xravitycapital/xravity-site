/*!
 * xravity-field.js — the living background from the Xravity vision film, for the web.
 *
 * One <canvas> behind the page. Three looks, same lattice:
 *   'gold'   — power distributed: champagne-gold network, travelling light pulses (default, the brand look)
 *   'cold'   — power concentrated: nodes pulled into three cold-blue gravity wells
 *   'silver' — neutral: faint silver lattice (the film's "tool is being born" moment)
 * setMode('gold') from 'cold' plays the film's burst: wells break, a gold shockwave ring expands, nodes spring back.
 *
 * Usage:
 *   <canvas id="xr-field" class="xr-field" aria-hidden="true"></canvas>
 *   <script src="/xravity-field.js"></script>          (classic script; also works as an ES-module side-effect import)
 *   <script>
 *     const field = new XravityField(document.getElementById('xr-field'), { mode: 'gold' });
 *   </script>
 *
 * Respects prefers-reduced-motion (draws one still frame), pauses when the tab is hidden
 * or the canvas is off-screen, caps devicePixelRatio, and thins the lattice on small screens.
 * No dependencies.
 */
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const DEFAULTS = {
  mode: 'gold',        // 'gold' | 'cold' | 'silver'
  spacing: 62,         // lattice spacing in CSS px (auto-widened on small screens)
  intensity: 0.6,      // 0..1.5 overall brightness of the network (film = 1; web default is calmer so text wins)
  shade: 0.75,         // 0..1 dark ellipse behind the centre so headlines stay readable (the film does this under every title)
  fog: true,           // warm (or cold) radial fog rising from the bottom
  dust: true,          // slow drifting motes
  vignette: true,      // darkened edges
  parallax: true,      // lattice drifts slightly with the pointer
  maxDpr: 1.5,
  seed: 11,
  background: '#0B0B0E'
};

class XravityField {
  constructor(canvas, options = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;
    this.o = { ...DEFAULTS, ...options };
    this.mode = this.o.mode;
    // continuous mode weights (0..1) so mode changes blend instead of cut
    this.w = { cold: this.mode === 'cold' ? 1 : 0, gold: this.mode === 'gold' ? 1 : 0 };
    this.burstAt = -1e9; this.t = 0; this.last = 0; this.running = false;
    this.ptr = { x: 0, y: 0, tx: 0, ty: 0, px: 0, py: 0, active: false };
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this.motion.matches;
    this.visible = true; this.raf = 0;
    this.light = document.documentElement.dataset.theme === 'light';
    this._resize = this.resize.bind(this); this._frame = this.frame.bind(this);
    this.resize();
    addEventListener('resize', this._resize);
    this._pointer = e => {
      if (e.pointerType === 'touch' || this.reduced) return;
      this.ptr.tx = (e.clientX / innerWidth - 0.5); this.ptr.ty = (e.clientY / innerHeight - 0.5);
      const r = this.c.getBoundingClientRect();
      this.ptr.px = e.clientX - r.left; this.ptr.py = e.clientY - r.top; this.ptr.active = true;
    };
    if (this.o.parallax) addEventListener('pointermove', this._pointer, { passive: true });
    this._leave = () => { this.ptr.active = false; };
    addEventListener('blur', this._leave);
    document.addEventListener('pointerleave', this._leave);
    this._visibility = () => document.hidden ? this.stop() : this.start();
    document.addEventListener('visibilitychange', this._visibility);
    this._motion = () => {
      this.reduced = this.motion.matches; this.stop();
      if (this.reduced) { this.w = {cold:this.mode==='cold'?1:0,gold:this.mode==='gold'?1:0}; this.draw(this.t); }
      else this.start();
    };
    this.motion.addEventListener('change', this._motion);
    this.themeObserver = new MutationObserver(() => { this.light = document.documentElement.dataset.theme === 'light'; if (this.reduced) this.draw(this.t); });
    this.themeObserver.observe(document.documentElement, {attributes:true,attributeFilter:['data-theme']});
    if ('IntersectionObserver' in window) {
      this.intersection = new IntersectionObserver(es => es.forEach(e => { this.visible = e.isIntersecting; this.visible ? this.start() : this.stop(); }));
      this.intersection.observe(canvas);
    }
    this.reduced ? this.draw(4) : this.start();
  }

  /** 'gold' | 'cold' | 'silver'. From cold → gold plays the burst. */
  setMode(mode) {
    if (!['gold','cold','silver'].includes(mode)) return;
    if (mode === this.mode) return;
    if (this.mode === 'cold' && mode === 'gold') this.burstAt = this.t;
    this.mode = mode;
    this.c.dataset.fieldMode = mode;
    if (this.reduced) { this.w = { cold: mode === 'cold' ? 1 : 0, gold: mode === 'gold' ? 1 : 0 }; this.draw(this.t); }
  }

  /** Play the cold → gold burst once (e.g. hero load). */
  burst() {
    if (this.reduced) { this.setMode('gold'); return; }
    this.w.cold = 1; this.w.gold = 0; this.mode = 'cold'; this.setMode('gold');
  }

  start() { if (this.running || this.reduced || !this.visible || document.hidden) return; this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this._frame); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); this.raf = 0; }
  destroy() {
    this.stop(); removeEventListener('resize',this._resize); removeEventListener('pointermove',this._pointer); removeEventListener('blur',this._leave);
    document.removeEventListener('pointerleave',this._leave); document.removeEventListener('visibilitychange',this._visibility);
    this.motion.removeEventListener('change',this._motion); this.intersection?.disconnect(); this.themeObserver?.disconnect();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, this.o.maxDpr);
    const r = this.c.getBoundingClientRect();
    this.W = Math.max(1, r.width); this.H = Math.max(1, r.height); this.dpr = dpr;
    this.c.width = Math.round(this.W * dpr); this.c.height = Math.round(this.H * dpr);
    this.build();
    if (this.reduced || !this.running) this.draw(this.t || 4);
  }

  build() {
    const R = rng(this.o.seed), W = this.W, H = this.H;
    const sp = this.o.spacing * (W < 700 ? 1.35 : 1);
    this.sp = sp; this.nodes = [];
    for (let row = 0, y = -20; y < H + 40; row++, y += sp * 0.866)
      for (let x = (row % 2 ? sp / 2 : 0) - 20; x < W + 40; x += sp)
        this.nodes.push({ tx: x + (R() - .5) * sp * 0.42, ty: y + (R() - .5) * sp * 0.42 });
    // three gravity wells, placed like the film (left-low, right, centre-bottom)
    this.centers = [{ x: W * 0.29, y: H * 0.61, s: 1.25 }, { x: W * 0.72, y: H * 0.56, s: 1.0 }, { x: W * 0.51, y: H * 0.8, s: 0.8 }];
    const scale = Math.min(W, H) / 1080;
    this.nodes.forEach(n => {
      n.ph = R() * TAU; n.c = R() < 0.45 ? 0 : (R() < 0.6 ? 1 : 2); n.ang = R() * TAU;
      n.rad = (14 + 230 * Math.pow(R(), 1.8)) * scale; n.sz = 0.8 + R() * 0.9; n.spark = R() < 0.18;
    });
    this.pairs = []; const lim = (sp * 1.22) ** 2;
    for (let i = 0; i < this.nodes.length; i++) for (let j = i + 1; j < this.nodes.length; j++) {
      const dx = this.nodes[i].tx - this.nodes[j].tx, dy = this.nodes[i].ty - this.nodes[j].ty;
      if (dx * dx + dy * dy < lim) this.pairs.push([i, j]);
    }
    this.pulses = []; const np = Math.round(this.pairs.length / 15);
    for (let k = 0; k < np; k++) this.pulses.push({ p: this.pairs[Math.floor(R() * this.pairs.length)], sp: 0.25 + R() * 0.5, off: R(), dir: R() < .5 });
    this.dust = []; const nd = Math.round(W * H / 30000);
    for (let i = 0; i < nd; i++) this.dust.push({ x: R() * W, y: R() * H, r: 0.8 + R() * 2.4, s: 4 + R() * 14, ph: R() * TAU, a: 0.1 + R() * 0.25 });
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    // ease mode weights toward target (~1.2 s)
    const k = 1 - Math.exp(-dt * 3.2);
    this.w.cold += ((this.mode === 'cold' ? 1 : 0) - this.w.cold) * k;
    this.w.gold += ((this.mode === 'gold' ? 1 : 0) - this.w.gold) * k;
    this.ptr.x += (this.ptr.tx - this.ptr.x) * k * 0.6; this.ptr.y += (this.ptr.ty - this.ptr.y) * k * 0.6;
    this.draw(this.t);
    this.raf = requestAnimationFrame(this._frame);
  }

  /** Draw one frame at time t (seconds). Also usable for static exports. */
  draw(t) {
    const { ctx, W, H, dpr, o } = this, wc = this.w.cold, wd = this.w.gold;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = this.light ? '#f7f8fa' : o.background; ctx.fillRect(0, 0, W, H);

    // fog
    if (o.fog) {
      const fogR = Math.max(W, H) * 0.62;
      const f = (a, col, y) => { if (a <= 0.01) return; const g = ctx.createRadialGradient(W / 2, y, 0, W / 2, y, fogR); g.addColorStop(0, col.replace('A', (0.55 * a).toFixed(3))); g.addColorStop(1, col.replace('A', '0')); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
      f(wc * (this.light ? .12 : 1), 'rgba(30,55,120,A)', H * 0.75);
      f(Math.max(wd, 0.35 * (1 - wc)) * (this.light ? .1 : 1), 'rgba(128,92,32,A)', H * 0.95);
    }

    // breathing camera + pointer parallax
    const bx = 7 * Math.sin(t * TAU / 17 + 0.6) + this.ptr.x * 18, by = 4.5 * Math.sin(t * TAU / 13 + 1.9) + this.ptr.y * 12;
    const bs = 1 + 0.011 * (0.5 - 0.5 * Math.cos(t * TAU / 11));
    ctx.save(); ctx.translate(W / 2 + bx, H / 2 + by); ctx.scale(bs, bs); ctx.translate(-W / 2, -H / 2);

    // node positions
    const sq = wc, P = new Array(this.nodes.length);
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const lx = n.tx + Math.sin(t * 0.6 + n.ph) * 3, ly = n.ty + Math.cos(t * 0.5 + n.ph) * 3;
      const c = this.centers[n.c], a = n.ang + t * (0.22 + 26 / (n.rad + 20)), r = n.rad * c.s * (1 - 0.4 * sq);
      const cx = c.x + Math.cos(a) * r, cy = c.y + Math.sin(a) * r * 0.78;
      let x = lerp(lx, cx, wc), y = lerp(ly, cy, wc);
      if (this.ptr.active && !this.reduced) {
        const dx = this.ptr.px - x, dy = this.ptr.py - y;
        const attraction = Math.max(0, 1 - Math.hypot(dx,dy) / 250) * .52;
        x += dx * attraction; y += dy * attraction;
      }
      P[i] = [x,y];
    }
    ctx.globalCompositeOperation = this.light ? 'source-over' : 'lighter';
    const I = o.intensity;

    // gravity wells
    if (wc > 0.01) {
      ctx.strokeStyle = `rgba(110,150,235,${0.05 * wc * I})`; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < this.nodes.length; i += 3) { const c = this.centers[this.nodes[i].c]; ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(c.x, c.y); }
      ctx.stroke();
      const sc = Math.min(W, H) / 1080;
      this.centers.forEach(c => {
        const rr = (60 + 210 * wc) * c.s * sc; const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rr);
        g.addColorStop(0, `rgba(200,218,255,${0.6 * wc * I})`); g.addColorStop(0.25, `rgba(70,115,230,${0.28 * wc * I})`); g.addColorStop(1, 'rgba(30,50,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, rr, 0, TAU); ctx.fill();
      });
    }

    // links + pulses
    const lc = (1 - wc) * (1 - wd) * 0.13 * I, lw = wd * 0.17 * I;
    if (lc > 0.005 || lw > 0.005) {
      ctx.lineWidth = 1; ctx.beginPath();
      for (const [i, j] of this.pairs) { ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); }
      if (lc > 0.005) { ctx.strokeStyle = this.light ? `rgba(82,96,117,${lc})` : `rgba(195,200,212,${lc})`; ctx.stroke(); }
      if (lw > 0.005) { ctx.strokeStyle = this.light ? `rgba(131,93,37,${lw})` : `rgba(217,179,108,${lw})`; ctx.stroke(); }
      const pl = Math.max(lc * 5, lw * 5);
      for (const q of this.pulses) {
        let u = (t * q.sp + q.off) % 1; if (q.dir) u = 1 - u; const a = P[q.p[0]], b = P[q.p[1]];
        ctx.fillStyle = wd > 0.5 ? `rgba(255,238,198,${0.9 * pl})` : `rgba(220,230,255,${0.8 * pl})`;
        ctx.beginPath(); ctx.arc(lerp(a[0], b[0], u), lerp(a[1], b[1], u), 2, 0, TAU); ctx.fill();
      }
    }

    // nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const base = [lerp(195, 110, wc), lerp(200, 150, wc), lerp(212, 235, wc)];
      const warm = n.spark ? [255, 242, 215] : [226, 186, 112];
      const cr = this.light ? lerp(82,131,wd) : lerp(base[0], warm[0], wd), cg = this.light ? lerp(96,93,wd) : lerp(base[1], warm[1], wd), cb = this.light ? lerp(117,37,wd) : lerp(base[2], warm[2], wd);
      const a = Math.min(1, 0.35 + I * 0.65) * (0.7 + 0.3 * Math.sin(t * 1.7 + n.ph * 3)) * lerp(0.75, 1, wd), s = n.sz * lerp(1.5, 2.3, wd);
      ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${a})`; ctx.beginPath(); ctx.arc(P[i][0], P[i][1], s, 0, TAU); ctx.fill();
      if (wd > 0.05) { ctx.fillStyle = `rgba(222,178,98,${0.09 * a * wd * Math.min(1, I)})`; ctx.beginPath(); ctx.arc(P[i][0], P[i][1], s * 5, 0, TAU); ctx.fill(); }
    }

    // burst shockwave rings (cold -> gold)
    const bd = t - this.burstAt;
    if (bd >= 0 && bd < 1.6) this.centers.forEach((c, k) => {
      const d = bd - k * 0.08; if (d < 0 || d > 1.3) return; const p = easeOutCubic(d / 1.3), r = 10 + Math.max(W, H) * 0.7 * p;
      ctx.strokeStyle = 'rgb(228,192,122)'; ctx.globalAlpha = (1 - p) * 0.85; ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.shadowColor = 'rgb(228,192,122)'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.94, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
    ctx.restore();

    // centre shade: keeps the reading area calm
    if (o.shade > 0 && !this.light) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.translate(W / 2, H * 0.5); ctx.scale(1.6, 1);
      const rr = Math.min(W / 1.6, H) * 0.62, g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
      g.addColorStop(0, `rgba(9,9,11,${0.8 * o.shade})`); g.addColorStop(1, 'rgba(9,9,11,0)');
      ctx.fillStyle = g; ctx.fillRect(-rr, -rr, rr * 2, rr * 2); ctx.restore();
    }

    // dust
    if (o.dust) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const warm = Math.max(wd, 0.3);
      for (const d of this.dust) {
        const x = (d.x + t * d.s + W) % W, y = (d.y - t * d.s * 0.4 + Math.sin(t * 0.5 + d.ph) * 12 + H * 2) % H;
        ctx.fillStyle = wc > .5 ? `rgba(170,190,235,${d.a})` : `rgba(239,217,168,${d.a * (this.light ? .3 : 1)})`;
        ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    // vignette
    if (o.vignette && !this.light) {
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.6);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.7)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
}

export { XravityField };
