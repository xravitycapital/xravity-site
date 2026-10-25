/** Film-inspired connected light, with the site's original pointer attraction.
 * Bounded node count, cached links/colors, DPR cap, and no idle animation loop.
 */
export function createBrandNetwork(canvas: HTMLCanvasElement, local = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, active: false };
  let width = 0, height = 0, dpr = 1, frame = 0, last = 0, time = 0;
  let visible = true, color = '217,179,108', alpha = 0.15;
  type Node = { x: number; y: number; ox: number; oy: number; phase: number; size: number };
  let nodes: Node[] = [];
  let links: [number, number, number][] = [];

  function readTheme() {
    const style = getComputedStyle(document.documentElement);
    color = local ? '217,179,108' : style.getPropertyValue('--particle-color').trim();
    alpha = local ? 0.24 : parseFloat(style.getPropertyValue('--particle-line-alpha')) * 0.65;
    if (motion.matches) draw();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    const cols = local ? 7 : Math.min(14, Math.max(5, Math.ceil(width / 120)));
    const rows = local ? 8 : Math.min(9, Math.max(5, Math.ceil(height / 130)));
    const sx = width / (cols - 1), sy = height / (rows - 1);
    nodes = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const ox = x * sx + (Math.random() - 0.5) * sx * 0.65;
      const oy = y * sy + (Math.random() - 0.5) * sy * 0.65;
      nodes.push({ x: ox, y: oy, ox, oy, phase: Math.random() * Math.PI * 2, size: 0.8 + Math.random() * 1.4 });
    }
    links = [];
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      if (Math.hypot(nodes[i].ox - nodes[j].ox, nodes[i].oy - nodes[j].oy) < Math.max(sx, sy) * 1.42) links.push([i, j, Math.random()]);
    }
    draw();
  }
  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const moving = !motion.matches;
    for (const n of nodes) {
      let tx = n.ox + (moving ? Math.sin(time * 0.22 + n.phase) * 9 : 0);
      let ty = n.oy + (moving ? Math.cos(time * 0.18 + n.phase) * 7 : 0);
      if (moving && pointer.active) {
        const dx = pointer.x - n.ox, dy = pointer.y - n.oy;
        const distance = Math.hypot(dx, dy), radius = local ? 220 : 250;
        const attraction = Math.max(0, 1 - distance / radius) * 0.52;
        tx += dx * attraction; ty += dy * attraction;
      }
      n.x += (tx - n.x) * 0.045; n.y += (ty - n.y) * 0.045;
    }
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    ctx.beginPath();
    for (const [a, b] of links) { ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); }
    ctx.stroke();
    for (const [a, b, offset] of links) {
      if (offset > 0.16) continue;
      const t = moving ? (time * 0.14 + offset * 5) % 1 : offset;
      ctx.fillStyle = `rgba(${color},${local ? 0.8 : 0.45})`;
      ctx.beginPath(); ctx.arc(nodes[a].x + (nodes[b].x - nodes[a].x) * t, nodes[a].y + (nodes[b].y - nodes[a].y) * t, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    for (const n of nodes) {
      const a = (local ? 0.6 : 0.32) + (moving ? Math.sin(time * 0.8 + n.phase) * 0.12 : 0);
      ctx.fillStyle = `rgba(${color},${a * 0.1})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.size * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(${color},${a})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2); ctx.fill();
    }
  }
  function tick(now: number) {
    frame = 0;
    time += Math.min((now - last) / 1000, 0.05); last = now;
    draw();
    if (!document.hidden && visible && !motion.matches) frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden && visible && !motion.matches) { last = performance.now(); frame = requestAnimationFrame(tick); }
    else if (motion.matches) draw();
  }
  function move(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const r = canvas.getBoundingClientRect();
    pointer.x = event.clientX - r.left; pointer.y = event.clientY - r.top;
    pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
  }
  readTheme(); resize(); sync();
  addEventListener('pointermove', move, { passive: true });
  addEventListener('blur', () => { pointer.active = false; });
  document.addEventListener('pointerleave', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(canvas);
  // Astro tears down this static document on navigation; no persistent global listeners.
}
