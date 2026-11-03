// hero particles: slow drifting dust on the dark side, faint links, soft cursor repel
(() => {
  const hero = document.getElementById('hero'), c = document.getElementById('particles');
  if (!hero || !c) return;
  const x = c.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINK = 130, REPEL = 150;
  let W = 0, H = 0, d = 1, P = [], run = false, ink = '243,236,233', acc = '255,92,122';
  const mouse = { x: -9999, y: -9999 };

  const theme = () => {
    const s = getComputedStyle(document.documentElement);
    ink = s.getPropertyValue('--ink-rgb').trim() || ink; acc = s.getPropertyValue('--accent-rgb').trim() || acc;
  };
  const make = () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22 * d, vy: (Math.random() - .5) * .22 * d,
    r: (.9 + Math.random() * 1.8) * d, red: Math.random() < .22, a: .4 + Math.random() * .5 });
  const fit = () => {
    const r = hero.getBoundingClientRect(); d = Math.min(devicePixelRatio || 1, 2);
    W = c.width = Math.max(1, r.width * d); H = c.height = Math.max(1, r.height * d);
    const n = Math.round(Math.min(95, Math.max(38, (r.width * r.height) / 11000)));
    P = Array.from({ length: n }, make);
    if (reduced) frame();
  };

  function frame() {
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
      const dx = p.x - mouse.x * d, dy = p.y - mouse.y * d, dist = Math.hypot(dx, dy), R = REPEL * d;
      if (dist < R && dist > 0) { const f = (1 - dist / R) * .9; p.x += (dx / dist) * f; p.y += (dy / dist) * f; }
    }
    for (let i = 0; i < P.length; i++) {
      const a = P[i];
      for (let j = i + 1; j < P.length; j++) {
        const b = P[j], dist = Math.hypot(a.x - b.x, a.y - b.y), L = LINK * d;
        if (dist < L) { x.strokeStyle = `rgba(${a.red || b.red ? acc : ink}, ${(1 - dist / L) * .26})`; x.lineWidth = d * .6;
          x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
      }
    }
    for (const p of P) { x.fillStyle = `rgba(${p.red ? acc : ink}, ${p.a})`; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
  }
  function loop() { if (!run) return; frame(); requestAnimationFrame(loop); }

  theme(); fit();
  addEventListener('resize', fit);
  addEventListener('themechange', () => { theme(); if (reduced) frame(); });
  addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  document.documentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -9999; });
  if (!reduced) new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) loop(); }).observe(hero);
})();
