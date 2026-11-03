// 3d is optional: if the CDN is blocked the rest of the page still works
(async () => {
window.__pf = true;
const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').catch(() => null);

const $ = (s, r = document) => r.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- data (from CV) ---------------- */
const jobs = [
  { when: '2025 — Present', role: 'Lead Technology Officer / Full-Stack Software Engineer', org: 'Lenderly Finance Corporation', pts: [
    'Lead and mentor a cross-functional engineering team, setting technical direction and owning delivery across mobile, web, and backend systems.',
    'Architect, develop, maintain, and deploy the company’s mobile app, web app, and core network infrastructure end-to-end, from backend and frontend development through CI/CD pipelines.',
    'Built and scaled “Lea AI”, an AI-powered platform for automated credit investigation, customer chat support, and 24/7 AI cold-calling for CRM outreach.',
    'Define system architecture, security, and infrastructure strategy to support rapid product growth in a fintech environment.' ] },
  { when: 'Present', role: 'Freelance Developer', org: 'Self-employed', pts: [
    'Deliver custom full-stack, mobile, and embedded software solutions for clients across multiple industries, managing projects independently from requirements through deployment.' ] },
  { when: '2024 — 2025', role: 'Full-Stack Software Engineer', org: 'Amici Mercantile Incorporation', pts: [
    'Developed cross-platform applications using Flutter, Java, and Kotlin across mobile and desktop.',
    'Built a Java-based Android app with time in/out tracking and GPS mapping for field agents, integrated with the main system for real-time monitoring.',
    'Engineered a real-time electronic heat sensor monitoring device using Flutter (UI) and C++ (Arduino).',
    'Designed and deployed Warehouse Management Systems (WMS) to improve logistics operations.',
    'Built and maintained scalable RESTful API web services in Python; maintained embedded business systems in Pascal Delphi.',
    'Handled server configuration and deployment on Linux, and delivered timely technical support to clients.' ] },
  { when: '2023', role: 'Web Developer Intern', org: 'E. Zarate Hospital', pts: [
    'Developed responsive, user-friendly web applications using PHP, JavaScript, and Bootstrap.',
    'Assisted in API development and documentation, and helped debug and troubleshoot to improve system stability.' ] },
  { when: '2019 — 2020', role: 'Desktop / IT Intern', org: 'Las Piñas National High School', pts: [
    'Supported development of desktop, mobile, and web applications.',
    'Contributed to debugging and assisted with creating API documentation.' ] }
];

const stack = [
  ['Languages', ['Java', 'C#', 'C++', 'JavaScript', 'PHP', 'Dart', 'Python', 'Kotlin', 'Swift']],
  ['Frameworks', ['React', 'React Native', 'VueJS', 'Tailwind CSS', 'Bootstrap', 'Laravel', 'CakePHP', 'ASP.NET', 'Flutter', 'NodeJS']],
  ['Databases', ['MySQL', 'MSSQL', 'MariaDB', 'MongoDB']],
  ['AI / Cloud / Tools', ['Firebase', 'Google Teachable Machine', 'LangChain', 'Torch', 'Transformers', 'Pip', 'Git']]
];

/* ---------------- static fills ---------------- */
$('#log').innerHTML = jobs.map((j, i) => `
  <div class="job rv${i === 0 ? ' open' : ''}">
    <button aria-expanded="${i === 0}">
      <span class="when">${j.when}</span>
      <span class="what">${j.role}<small>${j.org}</small></span>
      <span class="plus" aria-hidden="true"></span>
    </button>
    <div class="body"><div><ul>${j.pts.map(p => `<li>${p}</li>`).join('')}</ul></div></div>
  </div>`).join('');
$('#log').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const job = b.parentElement, open = job.classList.toggle('open');
  b.setAttribute('aria-expanded', open);
});

$('#stackList').innerHTML = stack.map(([k, v]) =>
  `<div class="row rv"><div class="k">${k}</div><div class="v">${v.map(x => `<span>${x}</span>`).join('')}</div></div>`).join('');

/* word-by-word statement */
const st = $('#statement');
st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span>${w}</span>`).join(' ');
const words = [...st.children];

/* ---------------- scroll: progress, reveals, statement ---------------- */
const prog = $('#prog');
function onScroll() {
  const h = document.documentElement;
  prog.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - innerHeight)})`;
  const r = st.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * .8 - r.top) / (r.height + innerHeight * .25)));
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < n));
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

/* ---------------- footer / contact ---------------- */
const manila = () => new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' });
const fc = $('#footClock'); const ft = () => fc.textContent = 'Manila, PH · ' + manila(); ft(); setInterval(ft, 30000);
const mail = $('#mail');
mail.addEventListener('click', async () => {
  const small = $('small', mail), t = small.textContent;
  try { await navigator.clipboard.writeText(mail.dataset.email); small.textContent = 'Copied ✓'; }
  catch { location.href = 'mailto:' + mail.dataset.email; }
  setTimeout(() => small.textContent = t, 1800);
});

/* ---------------- starfield (2d, fixed, parallax) ---------------- */
{
  const c = $('#stars'), x = c.getContext('2d');
  let W, H, stars = [];
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2); W = c.width = innerWidth * d; H = c.height = innerHeight * d;
    stars = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: .2 + Math.random(), r: (.4 + Math.random() * 1.1) * d, t: Math.random() * 6 }));
  };
  fit(); addEventListener('resize', fit);
  const readInk = () => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#f3ece9';
  let starCol = readInk(); addEventListener('themechange', () => starCol = readInk());
  let sy = 0;
  addEventListener('scroll', () => sy = scrollY, { passive: true });
  (function draw(t) {
    x.clearRect(0, 0, W, H);
    for (const s of stars) {
      const y = ((s.y - sy * s.z * .25) % H + H) % H;
      x.globalAlpha = (.25 + .35 * Math.sin(t / 1400 + s.t)) * s.z;
      x.fillStyle = starCol; x.fillRect(s.x, y, s.r, s.r);
    }
    reduced || requestAnimationFrame(draw);
  })(0);
}

/* ---------------- 3d constellation ---------------- */
const stage = $('#stage'), cvs = $('#gl'), cursorEl = $('#cursor');
const panel = $('#panel'), idx = $('#index');
let nodes = [], edges = [];
let active = -1;
function setActive(i, quiet) {
  if (i === active) return; active = i;
  const p = projects[i], cl = clusters[p.c];
  const fill = () => {
    panel.style.setProperty('--c', 'var(--c-' + p.c + ')');
    $('#pNo', panel).textContent = String(i + 1).padStart(2, '0') + ' / ' + String(projects.length).padStart(2, '0');
    $('#pCl', panel).textContent = cl.name;
    $('#pName', panel).textContent = p.n;
    $('#pChips', panel).innerHTML = p.s.map(s => `<span>${s}</span>`).join('');
    $('#pDesc', panel).innerHTML = p.d.map(s => `<li>${s}</li>`).join('');
    $('#pMore', panel).href = 'project.html?p=' + p.slug;
    panel.classList.remove('swapping');
  };
  if (quiet) fill(); else { panel.classList.add('swapping'); setTimeout(fill, 200); }
  [...idx.children].forEach((li, k) => { const b = li.firstChild; b.classList.toggle('on', k === i); if (k === i) b.style.setProperty('--c', 'var(--c-' + p.c + ')'); });
  nodes.forEach((n, k) => n.tag.classList.toggle('on', k === i));
  edges.forEach(e => e.line.userData.hot = e.a === i || e.b === i);
}
idx.innerHTML = projects.map((p, i) => `<li><button data-i="${i}">${p.n}</button></li>`).join('');
idx.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setActive(+b.dataset.i); });
idx.addEventListener('pointerover', e => { const b = e.target.closest('button'); if (b && matchMedia('(hover: hover)').matches) setActive(+b.dataset.i); });
addEventListener('keydown', e => {
  const r = stage.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
  if (e.key === 'ArrowRight') setActive((active + 1) % projects.length);
  if (e.key === 'ArrowLeft') setActive((active - 1 + projects.length) % projects.length);
});
setActive(3, true);


if (THREE) {
const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, .1, 100); camera.position.z = 8.5;
const group = new THREE.Group(); scene.add(group);
const rootCS = () => getComputedStyle(document.documentElement);
const cssCol = k => new THREE.Color(rootCS().getPropertyValue(k).trim());
const ink = new THREE.Color(0xf3ece9); let haloK = 1, edgeBase = .13;

const glow = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
})();

// dust
let dust;
{
  const n = 700, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = 4 + Math.random() * 5, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
    p.set([r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a) * .8, r * Math.cos(b)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  dust = new THREE.Points(g, new THREE.PointsMaterial({ size: .025, color: 0xf3ece9, transparent: true, opacity: .45, depthWrite: false })); group.add(dust);
}

nodes = projects.map((p, i) => {
  const cl = clusters[p.c], col = cssCol('--c-' + p.c);
  const pos = new THREE.Vector3(...cl.at).add(new THREE.Vector3(...p.o).multiplyScalar(1.15));
  const core = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 24), new THREE.MeshBasicMaterial({ color: col }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(.9);
  const hit = new THREE.Mesh(new THREE.SphereGeometry(.38, 8, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.userData.i = i;
  const g = new THREE.Group(); g.position.copy(pos); g.add(core, halo, hit); group.add(g);
  const tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = p.n.split(' ').slice(0, 2).join(' ').replace(/ &$/, ''); stage.appendChild(tag);
  return { g, core, halo, hit, tag, col, pos, key: p.c };
});

edges = pairs.map(([a, b]) => {
  const geo = new THREE.BufferGeometry().setFromPoints([nodes[a].pos, nodes[b].pos]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: .14 }));
  group.add(line); return { a, b, line };
});


function applyTheme() {
  const light = document.documentElement.dataset.theme === 'light';
  ink.set(rootCS().getPropertyValue('--ink').trim());
  haloK = light ? .5 : 1; edgeBase = light ? .22 : .13;
  dust.material.color.copy(ink); dust.material.opacity = light ? .3 : .45;
  nodes.forEach(n => {
    n.col.copy(cssCol('--c-' + n.key)); n.core.material.color.copy(n.col); n.halo.material.color.copy(n.col);
    n.halo.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; n.halo.material.needsUpdate = true;
  });
}
applyTheme(); addEventListener('themechange', applyTheme);

{ const a0 = active; active = -1; setActive(a0, true); }  // re-apply highlight now nodes exist

// interaction
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
let hover = false, visible = false, running = false;
function pick(e) {
  const r = cvs.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const h = ray.intersectObjects(nodes.map(n => n.hit))[0];
  return h ? h.object.userData.i : -1;
}
stage.addEventListener('pointermove', e => {
  const r = cvs.getBoundingClientRect();
  tgt.y = (((e.clientX - r.left) / r.width) - .5) * .7; tgt.x = (((e.clientY - r.top) / r.height) - .5) * .35;
  const i = pick(e); hover = i >= 0; cursorEl.classList.toggle('link', hover);
  if (hover) setActive(i);
});
stage.addEventListener('pointerleave', () => { hover = false; cursorEl.classList.remove('link'); tgt.x = tgt.y = 0; });
stage.addEventListener('pointerdown', e => { const i = pick(e); if (i >= 0) setActive(i); });

function fit() {
  const r = stage.getBoundingClientRect(); renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.position.z = r.width < 520 ? 14 : 8.5; camera.updateProjectionMatrix();
}
new ResizeObserver(fit).observe(stage); fit();
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !running) { running = true; loop(); } }).observe(stage);

const v = new THREE.Vector3(); let t0 = 0, spin = 0;
function loop(t = 0) {
  if (!visible) { running = false; return; }
  const dt = Math.min(.05, (t - t0) / 1000 || 0); t0 = t;
  if (!hover && !reduced) spin += dt * .12;
  cur.x += (tgt.x - cur.x) * .06; cur.y += (tgt.y - cur.y) * .06;
  group.rotation.y = spin + cur.y; group.rotation.x = cur.x;
  const r = stage.getBoundingClientRect();
  nodes.forEach((n, i) => {
    const on = i === active;
    n.core.scale.setScalar(THREE.MathUtils.lerp(n.core.scale.x, on ? 1.8 : 1, .15));
    n.halo.scale.setScalar(THREE.MathUtils.lerp(n.halo.scale.x, on ? 2.1 : .9, .12));
    n.halo.material.opacity = (on ? .9 : .4 + .15 * Math.sin(t / 900 + i)) * haloK;
    n.g.getWorldPosition(v); const wz = v.z; v.project(camera);
    n.tag.style.transform = `translate(${(v.x * .5 + .5) * r.width + 12}px, ${(-v.y * .5 + .5) * r.height - 6}px)`;
    n.tag.style.opacity = on ? 1 : Math.max(.12, Math.min(.8, .45 + wz * .14));
  });
  edges.forEach(e => { const m = e.line.material, goal = e.line.userData.hot ? .75 : edgeBase; m.opacity += (goal - m.opacity) * .1; m.color.set(e.line.userData.hot ? nodes[active].col : ink); });
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
}
else stage.insertAdjacentHTML('beforeend', '<p class="corner a" style="position:static;padding:20px">3D view unavailable \u2014 use the list below.</p>');
})();
