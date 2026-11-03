(() => {
const slug = new URLSearchParams(location.search).get('p');
const i = projects.findIndex(p => p.slug === slug);
if (i < 0) { location.replace('index.html#projects'); return; }

const p = projects[i], cl = clusters[p.c];
const n = projects.length, pad = x => String(x + 1).padStart(2, '0');
const prev = projects[(i - 1 + n) % n], next = projects[(i + 1) % n];
const href = q => 'project.html?p=' + q.slug;
const related = [...new Set(pairs.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)))];

document.title = p.n + ' — Joshua Mahinay';
document.documentElement.style.setProperty('--c', 'var(--c-' + p.c + ')');

// relation map: this project in the centre, linked projects on an arc
function map() {
  const W = 640, H = 360, cx = W / 2, cy = H / 2, R = 125;
  const pts = related.map((k, j) => {
    const a = (j / related.length) * Math.PI * 2 - Math.PI / 2;
    return { k, x: cx + Math.cos(a) * R * 1.55, y: cy + Math.sin(a) * R };
  });
  const lines = pts.map(q => `<line x1="${cx}" y1="${cy}" x2="${q.x}" y2="${q.y}" style="stroke:var(--c-${projects[q.k].c})" stroke-opacity=".5"/>`).join('');
  const dots = pts.map(q => { const t = projects[q.k], c = 'var(--c-' + t.c + ')';
    return `<a href="${href(t)}" class="rn"><circle cx="${q.x}" cy="${q.y}" r="7" style="fill:${c}"/><circle cx="${q.x}" cy="${q.y}" r="16" style="fill:${c}" opacity=".16"/>
      <text x="${q.x}" y="${q.y + 32}" text-anchor="middle">${t.n}</text></a>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Projects connected to ${p.n}">${lines}
    <circle cx="${cx}" cy="${cy}" r="12" style="fill:var(--c-${p.c})"/><circle cx="${cx}" cy="${cy}" r="30" style="fill:var(--c-${p.c})" opacity=".18"/>
    <text x="${cx}" y="${cy + 52}" text-anchor="middle" class="me">${p.n}</text>${dots}</svg>`;
}

document.getElementById('pj').innerHTML = `
  <header class="pj-hero">
    <div class="pj-no rv in">${pad(i)} / ${pad(n - 1)} &middot; <span>${cl.name}</span></div>
    <h1 class="rv in">${p.n}</h1>
    <p class="pj-lead rv in">${p.d[0]}</p>
    <div class="chips rv in">${p.s.map(s => `<span>${s}</span>`).join('')}</div>
    ${(p.links || []).length ? `<div class="pj-links rv in">${p.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label} &nearr;</a>`).join('')}</div>` : ''}
  </header>

  <section class="pj-grid">
    <dl class="facts">
      <div><dt>Type</dt><dd>${p.kind}</dd></div>
      <div><dt>Group</dt><dd>${cl.name}</dd></div>
      <div><dt>Stack</dt><dd>${p.s.join(' · ')}</dd></div>
      ${p.ctx ? `<div><dt>Context</dt><dd>${p.ctx}</dd></div>` : ''}
      ${(p.links || []).map(l => `<div><dt>Link</dt><dd><a href="${l.url}" target="_blank" rel="noopener">${l.label} &nearr;</a></dd></div>`).join('')}
    </dl>
    <div>
      ${p.d.length > 1 ? `<h2 class="pj-h">Highlights</h2><ul class="pj-ul">${p.d.slice(1).map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${related.length ? `<h2 class="pj-h">Connected systems</h2><div class="pj-map">${map()}</div>` : ''}
    </div>
  </section>

  ${(p.shots || []).length ? `<section class="pj-shots"><h2 class="pj-h">Screens</h2><div class="pj-sg">${p.shots.map((s, k) => `<button class="pj-shot" data-k="${k}" aria-label="Open screenshot ${k + 1}"><img src="${s}" alt="${p.n} screenshot ${k + 1}" loading="lazy"></button>`).join('')}</div></section>` : ''}

  <div class="pj-pn" role="navigation" aria-label="Other projects">
    <a href="${href(prev)}"><small>&larr; Previous</small>${prev.n}</a>
    <a href="${href(next)}"><small>Next &rarr;</small>${next.n}</a>
  </div>`;

// lightbox
const box = document.createElement('div'); box.className = 'lb'; box.innerHTML = '<img alt="">'; document.body.appendChild(box);
let lb = -1;
const show = k => { const sh = p.shots || []; if (!sh.length) return; lb = (k + sh.length) % sh.length; box.querySelector('img').src = sh[lb]; box.classList.add('on'); };
const hide = () => { lb = -1; box.classList.remove('on'); };
document.addEventListener('click', e => { const b = e.target.closest('.pj-shot'); if (b) show(+b.dataset.k); else if (e.target.closest('.lb')) hide(); });

addEventListener('keydown', e => {
  if (lb >= 0) { if (e.key === 'Escape') hide(); if (e.key === 'ArrowRight') show(lb + 1); if (e.key === 'ArrowLeft') show(lb - 1); return; }
  if (e.key === 'ArrowLeft') location.href = href(prev);
  if (e.key === 'ArrowRight') location.href = href(next);
  if (e.key === 'Escape') location.href = 'index.html#projects';
});

// ring cursor
const cur = document.getElementById('cursor');
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.body.style.cursor = 'none';
  addEventListener('pointermove', e => {
    cur.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; cur.classList.add('on');
    const l = window.__badgeHover || (e.target.closest && e.target.closest('a')); cur.style.width = cur.style.height = l ? '44px' : '';
    cur.style.margin = l ? '-22px 0 0 -22px' : ''; cur.style.borderColor = l ? 'var(--c)' : '';
  });
}
})();
