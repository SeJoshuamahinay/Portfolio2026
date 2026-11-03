// Round ID medallion on a lanyard in the top-left nav.
// Same idea as Vercel's react-three-fiber badge (fixed anchor -> chain -> card, strap drawn as a curve,
// card dragged by the pointer, tilt eased back to face the viewer) but with a small Verlet rope
// instead of Rapier, so there is no WASM to download.
(async () => {
  const canvas = document.getElementById('badge');
  if (!canvas) return;
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').catch(() => null);
  if (!THREE) return;                                   // keep the plain "JM" logo if 3D is unavailable

  const root = document.documentElement;
  const cursorEl = document.getElementById('cursor');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, -600, 600);   // 1 unit = 1 css px, y up (sim uses y down)
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.position.set(-160, 240, 420); scene.add(sun);

  let cw = 280, ch = 560, base = 1, AX = 90;
  const AY = -16;                                       // anchor sits just above the viewport top
  function fit() {
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    renderer.setSize(cw, ch, false);
    cam.right = cw; cam.bottom = -ch; cam.updateProjectionMatrix();
    base = Math.min(1, Math.max(.62, innerHeight / 900)) * (innerWidth < 760 ? .8 : 1);
    AX = cw * .32;
  }
  addEventListener('resize', fit); fit();

  /* ---------------- textures (square, circle drawn inscribed) ---------------- */
  const TS = 800;
  const makeTex = () => { const c = document.createElement('canvas'); c.width = c.height = TS;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, t }; };
  const F = makeTex(), K = makeTex();
  const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
  const photo = new Image(); let photoOk = false;
  photo.onload = () => { photoOk = true; paintCard(); };
  photo.src = 'assets/portrait-bw.jpg';

  const palette = () => root.dataset.theme === 'light'
    ? { bg: '#ffffff', ink: '#1a0a0e', dim: 'rgba(26,10,14,.62)', acc: '#c2113a', edge: 0xe6e0dd }
    : { bg: '#130609', ink: '#f3ece9', dim: 'rgba(243,236,233,.62)', acc: '#ff5c7a', edge: 0x0c0406 };

  // text set around a circle, spaced so the unit repeats evenly all the way round
  function ringText(x, text, cx, cy, r, px, color) {
    x.save(); x.font = `700 ${px}px ${FONT}`; x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    const w1 = x.measureText(text).width, n = Math.max(1, Math.round((2 * Math.PI * r) / (w1 + text.length * 4)));
    const chars = [...text.repeat(n)], widths = chars.map(c => x.measureText(c).width);
    const extra = (2 * Math.PI * r - widths.reduce((p, q) => p + q, 0)) / chars.length;
    let ang = -Math.PI / 2;
    chars.forEach((c, i) => { const w = widths[i] + extra, a = ang + (w / 2) / r;
      x.save(); x.translate(cx, cy); x.rotate(a + Math.PI / 2); x.fillText(c, 0, -r); x.restore(); ang += w / r; });
    x.restore();
  }
  function disc(x, p) {
    x.clearRect(0, 0, TS, TS); x.fillStyle = p.bg; x.fillRect(0, 0, TS, TS);
    x.fillStyle = p.acc; x.beginPath(); x.arc(400, 400, 400, 0, 7); x.arc(400, 400, 338, 0, 7, true); x.fill('evenodd');   // accent ring band
  }
  function paintCard() {
    const p = palette();
    let x = F.c.getContext('2d'); disc(x, p);
    ringText(x, 'JOSHUA MAHINAY  \u2022  PORTFOLIO 2026  \u2022  ', 400, 400, 369, 34, '#fff');
    // portrait
    x.save(); x.beginPath(); x.arc(400, 400, 300, 0, 7); x.clip();
    const g = x.createRadialGradient(400, 320, 40, 400, 400, 300); g.addColorStop(0, '#5a0716'); g.addColorStop(1, '#14040a');
    x.fillStyle = g; x.fillRect(100, 100, 600, 600);
    if (photoOk) {
      const iw = photo.naturalWidth, ih = photo.naturalHeight, sw = iw * .62;      // square crop: head + shoulders
      x.drawImage(photo, iw * .19, ih * .06, sw, sw, 100, 100, 600, 600);
      try { x.getImageData(400, 400, 1, 1); } catch (e) { x.fillStyle = g; x.fillRect(100, 100, 600, 600); }   // tainted (file://) -> placeholder
    }
    x.restore();
    x.strokeStyle = p.ink; x.globalAlpha = .22; x.lineWidth = 4; x.beginPath(); x.arc(400, 400, 312, 0, 7); x.stroke(); x.globalAlpha = 1;
    F.t.needsUpdate = true;

    x = K.c.getContext('2d'); disc(x, p);
    ringText(x, 'FULL-STACK  \u2022  AI  \u2022  EMBEDDED  \u2022  ', 400, 400, 369, 34, '#fff');
    x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = p.acc; x.font = `700 300px ${FONT}`; if ('letterSpacing' in x) x.letterSpacing = '-12px';
    x.fillText('JM', 400, 480);
    x.fillStyle = p.dim; x.font = `600 30px ${FONT}`; if ('letterSpacing' in x) x.letterSpacing = '4px'; x.fillText('MANILA, PH', 400, 560);
    K.t.needsUpdate = true;
  }

  const strapTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#c2113a'; x.fillRect(0, 0, 512, 64);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, 512, 5); x.fillRect(0, 59, 512, 5);
    x.fillStyle = '#fff'; x.font = `700 28px ${FONT}`; x.textBaseline = 'middle'; if ('letterSpacing' in x) x.letterSpacing = '3px';
    x.fillText('JOSHUA MAHINAY  \u00b7  PORTFOLIO 2026  \u00b7', 14, 33);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  })();

  /* ---------------- 3d objects: a round medallion on a clip ---------------- */
  const R = 82, DIA = R * 2, DEP = 6, CLIP = 22;
  const mat = map => new THREE.MeshPhysicalMaterial({ map, roughness: .36, metalness: .08, clearcoat: .85, clearcoatRoughness: .18 });
  const faceGeo = new THREE.CircleGeometry(R, 72);
  const front = new THREE.Mesh(faceGeo, mat(F.t)); front.position.z = DEP / 2 + .2;
  const back = new THREE.Mesh(faceGeo, mat(K.t)); back.position.z = -(DEP / 2 + .2); back.rotation.y = Math.PI;
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0c0406, roughness: .55, metalness: .3 });
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(R, R, DEP, 72, 1, true), edgeMat); edge.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 1, 2.4, 10, 72), new THREE.MeshStandardMaterial({ color: 0xd8d8df, metalness: .6, roughness: .28 }));
  const rim2 = rim.clone(); rim.position.z = DEP / 2; rim2.position.z = -DEP / 2;
  const metal = new THREE.MeshStandardMaterial({ color: 0xcfcfd6, metalness: .55, roughness: .3 });
  const neck = new THREE.Mesh(new THREE.BoxGeometry(14, 12, DEP + 2), metal); neck.position.y = R + 4;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 2.4, 10, 28), metal); ring.position.y = R + 14;
  const card = new THREE.Group(); card.rotation.order = 'ZYX';
  card.add(front, back, edge, rim, rim2, neck, ring); scene.add(card);

  const SEG = 28, rg = new THREE.BufferGeometry();
  const rpos = new Float32Array((SEG + 1) * 6), ruv = new Float32Array((SEG + 1) * 4), ridx = [];
  for (let i = 0; i < SEG; i++) { const a = i * 2; ridx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3)); rg.setAttribute('uv', new THREE.BufferAttribute(ruv, 2)); rg.setIndex(ridx);
  const ribbon = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: strapTex, side: THREE.DoubleSide }));
  ribbon.position.z = -3; ribbon.frustumCulled = false; scene.add(ribbon);

  /* ---------------- verlet rope + card ---------------- */
  const LINK = 34;                                       // px per rope link at scale 1
  const pt = (x, y, w) => ({ x, y, px: x, py: y, w });
  const P = [pt(AX, AY, 0), pt(AX + 8, AY + LINK, 1), pt(AX + 16, AY + LINK * 2, 1), pt(AX + 24, AY + LINK * 3, 1), pt(AX + 34, AY + LINK * 4, .7)];
  const B = pt(AX + 70, AY + LINK * 4 + DIA + CLIP, .25);   // card bottom; heavier than the rope so it hangs and swings
  const all = [...P, B];
  let sc = base, spin = 0, spinV = 0, drag = null, wasHover = false, suppress = false;
  const ptr = { x: -999, y: -999 };

  function constrain(a, b, len) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, k = (d - len) / d, w = a.w + b.w;
    if (!w) return; a.x += dx * k * a.w / w; a.y += dy * k * a.w / w; b.x -= dx * k * b.w / w; b.y -= dy * k * b.w / w;
  }
  function sim(h, t) {
    const L = LINK * sc, H = (DIA + CLIP) * sc;
    P[0].x = AX; P[0].y = AY;
    for (const p of all) {
      if (!p.w) continue;
      const damp = p === B ? .992 : .995, vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
      p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + 2600 * h * h;
    }
    B.x += Math.sin(t / 1100) * .018;                    // idle sway
    for (let it = 0; it < 10; it++) { for (let i = 0; i < 4; i++) constrain(P[i], P[i + 1], L); constrain(P[4], B, H); P[0].x = AX; P[0].y = AY; }
  }

  /* ---------------- interaction ---------------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(px, py) {
    if (px < 0 || py < 0 || px > cw || py > ch) return false;
    ndc.set(px / cw * 2 - 1, 1 - py / ch * 2); ray.setFromCamera(ndc, cam);
    return ray.intersectObjects([front, back, edge, ring, neck], false).length > 0;
  }
  const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let down = null;
  addEventListener('pointermove', e => {
    const [x, y] = local(e); ptr.x = x; ptr.y = y;
    const h = drag ? true : hit(x, y); window.__badgeHover = h;
    if (cursorEl) { if (h) cursorEl.classList.add('link'); else if (wasHover) cursorEl.classList.remove('link'); }
    wasHover = h;
  });
  addEventListener('pointerdown', e => {
    const [x, y] = local(e);
    if (!hit(x, y)) return;
    drag = { ox: B.x - x, oy: B.y - y }; down = { x: e.clientX, y: e.clientY, t: performance.now() }; suppress = true;
    document.body.style.userSelect = 'none';
  });
  const release = () => {
    if (!drag) return; drag = null; B.w = .25;
    B.px = B.x - (B.x - B.px) * .5;                      // keep the throw, scaled for the sub-stepped sim
    document.body.style.userSelect = '';
    setTimeout(() => { suppress = false; }, 350);
  };
  addEventListener('pointerup', e => {
    if (!drag) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 400;
    release();
    if (moved < 6 && quick) {                            // a tap: go home
      const href = canvas.dataset.href;
      if (href) location.href = href; else if (window.lenis) window.lenis.scrollTo(0); else scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  addEventListener('pointercancel', release);
  addEventListener('click', e => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);   // don't click through to the page under the card
  addEventListener('themechange', () => { paintCard(); edgeMat.color.setHex(palette().edge); });
  paintCard(); edgeMat.color.setHex(palette().edge);

  /* ---------------- frame ---------------- */
  const v3 = (p) => new THREE.Vector3(p.x, -p.y, 0);
  let last = performance.now(), acc = 0, shown = false;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; acc += dt;

    // shrink toward the nav as the page scrolls so it stops covering content
    const tt = canvas.dataset.compact !== undefined ? 1 : Math.min(1, scrollY / (innerHeight * .6)), e = tt * tt * (3 - 2 * tt);   // compact pages start small
    sc += (base * (1 - .48 * e) - sc) * .08;

    if (drag) {
      const reach = (LINK * 4 + (DIA + CLIP)) * sc * .985;
      let tx = ptr.x + drag.ox, ty = ptr.y + drag.oy, dx = tx - AX, dy = ty - AY, d = Math.hypot(dx, dy);
      if (d > reach) { tx = AX + dx / d * reach; ty = AY + dy / d * reach; }
      const ox = B.x, oy = B.y; B.x += (tx - B.x) * .55; B.y += (ty - B.y) * .55; B.px = ox; B.py = oy; B.w = 0;
    }
    while (acc >= 1 / 120) { sim(1 / 120, now); acc -= 1 / 120; }

    // card pose: hangs from the clip (top of the rope), tilt follows the rope direction
    const T = P[4], dx = B.x - T.x, dy = B.y - T.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, mid = (CLIP + R) / (CLIP + DIA);
    const cx = T.x + dx * mid, cy = T.y + dy * mid;
    spinV += (cx - (card.userData.cx ?? cx)) * .012 - spin * .06; spinV *= .94; spin = Math.max(-1.1, Math.min(1.1, spin + spinV));   // swing -> spin, eased back to face front
    card.userData.cx = cx;
    card.position.set(cx, -cy, 0); card.scale.setScalar(sc);
    card.rotation.z = -Math.atan2(ux, uy); card.rotation.y = spin;

    // strap: smooth curve through the rope points, drawn as a textured ribbon
    const curve = new THREE.CatmullRomCurve3([...P.map(v3)], false, 'centripetal');
    const pts = curve.getPoints(SEG), halfW = 8 * Math.max(.7, sc) ; let dist = 0;
    for (let i = 0; i <= SEG; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(SEG, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (i) dist += pts[i].distanceTo(pts[i - 1]);
      const nx = -ty * halfW, ny = tx * halfW, o = i * 6;
      rpos[o] = pts[i].x + nx; rpos[o + 1] = pts[i].y + ny; rpos[o + 2] = 0; rpos[o + 3] = pts[i].x - nx; rpos[o + 4] = pts[i].y - ny; rpos[o + 5] = 0;
      const u = dist / 230; ruv[i * 4] = u; ruv[i * 4 + 1] = 0; ruv[i * 4 + 2] = u; ruv[i * 4 + 3] = 1;
    }
    rg.attributes.position.needsUpdate = true; rg.attributes.uv.needsUpdate = true;

    renderer.render(scene, cam);
    if (!shown) { shown = true; root.classList.add('badge-on'); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
