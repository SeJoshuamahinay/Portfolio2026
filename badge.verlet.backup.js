// ID card on a lanyard in the top-left nav.
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

  /* ---------------- textures (portrait card) ---------------- */
  const TW = 560, TH = 800;
  const makeTex = () => { const c = document.createElement('canvas'); c.width = TW; c.height = TH;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, t }; };
  const F = makeTex(), K = makeTex();
  const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
  const rr = (x, px, py, w, h, r) => { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
  const photo = new Image(); let photoOk = false;
  photo.onload = () => { photoOk = true; paintCard(); };
  photo.src = 'assets/robot-red.jpg';

  // inverted on purpose: black card on the light page, white card on the dark page
  const palette = () => root.dataset.theme === 'light'
    ? { bg: '#130609', ink: '#f3ece9', dim: 'rgba(243,236,233,.62)', acc: '#ff5c7a', slot: 'rgba(0,0,0,.6)', edge: 0x0c0406 }
    : { bg: '#ffffff', ink: '#1a0a0e', dim: 'rgba(26,10,14,.62)', acc: '#c2113a', slot: 'rgba(0,0,0,.12)', edge: 0xe6e0dd };

  function barcode(x, px, py, w, h, color) {
    let s = 7; x.fillStyle = color; let cx = px;
    while (cx < px + w) { s = (s * 9301 + 49297) % 233280; const bw = 2 + (s / 233280) * 4, gap = 2 + ((s >> 3) % 3);
      x.fillRect(cx, py, bw, h); cx += bw + gap; }
  }
  function paintCard() {
    const p = palette(), ls = v => { if ('letterSpacing' in x) x.letterSpacing = v; };
    let x = F.c.getContext('2d');
    x.clearRect(0, 0, TW, TH); x.fillStyle = p.bg; x.fillRect(0, 0, TW, TH);
    x.fillStyle = p.acc; x.fillRect(0, 0, TW, 18);
    x.fillStyle = p.dim; x.font = `600 22px ${FONT}`; x.textBaseline = 'alphabetic'; ls('4px');
    x.fillText('PORTFOLIO', 48, 112); x.textAlign = 'right'; x.fillText('2026', 512, 112); x.textAlign = 'left';
    // portrait
    x.save(); rr(x, 48, 134, 464, 386, 26); x.clip();
    const g = x.createLinearGradient(0, 134, 0, 520); g.addColorStop(0, '#3a0510'); g.addColorStop(1, '#14040a');
    x.fillStyle = g; x.fillRect(48, 134, 464, 386);
    if (photoOk) {
      const iw = photo.naturalWidth, ih = photo.naturalHeight, sw = iw * .8, sh = sw * 386 / 464;
      x.drawImage(photo, iw * .1, ih * .03, sw, sh, 48, 134, 464, 386);
      try { x.getImageData(0, 0, 1, 1); } catch (e) { x.fillStyle = g; x.fillRect(48, 134, 464, 386); }   // tainted (file://) -> placeholder
    }
    x.restore();
    // status chip
    x.fillStyle = 'rgba(0,0,0,.6)'; rr(x, 68, 154, 290, 40, 20); x.fill();
    x.fillStyle = '#4ade80'; x.beginPath(); x.arc(90, 174, 6, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = `700 15px ${FONT}`; ls('2.5px'); x.fillText('OPEN TO RELOCATION', 106, 180);
    // name + role
    ls('-2px'); x.fillStyle = p.ink; x.font = `700 72px ${FONT}`; x.fillText('Joshua', 48, 608);
    x.fillStyle = p.dim; x.fillText('Mahinay', 48, 674);
    ls('0px'); x.font = `500 25px ${FONT}`; x.fillText('CTO · Full-stack engineer', 48, 718);
    barcode(x, 48, 742, 230, 36, p.ink);
    x.textAlign = 'right'; x.font = `600 20px ${FONT}`; ls('3px'); x.fillText('MANILA, PH', 512, 772); x.textAlign = 'left';
    F.t.needsUpdate = true;

    x = K.c.getContext('2d');
    x.clearRect(0, 0, TW, TH); x.fillStyle = p.bg; x.fillRect(0, 0, TW, TH);
    x.fillStyle = p.acc; x.fillRect(0, 0, TW, 18);
    x.textAlign = 'center'; x.fillStyle = p.acc; x.font = `700 200px ${FONT}`; ls('-8px'); x.fillText('JM', 280, 430);
    x.fillStyle = p.dim; x.font = `600 22px ${FONT}`; ls('3px');
    x.fillText('FULL-STACK · AI · EMBEDDED', 280, 520); x.fillText('joshuamahinay.netlify.app', 280, 560);
    x.textAlign = 'left'; barcode(x, 48, 700, 464, 40, p.ink);
    K.t.needsUpdate = true;
  }

  const strapTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#c2113a'; x.fillRect(0, 0, 512, 64);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, 512, 5); x.fillRect(0, 59, 512, 5);
    x.fillStyle = '#fff'; x.font = `700 28px ${FONT}`; x.textBaseline = 'middle'; if ('letterSpacing' in x) x.letterSpacing = '3px';
    x.fillText('JOSHUA MAHINAY  ·  PORTFOLIO 2026  ·', 14, 33);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  })();

  /* ---------------- 3d objects: rounded-rectangle ID card on a clip ---------------- */
  const CW = 140, CH = 200, CR = 11, DEP = 5, CLIP = 0;   // CLIP 0: the lace attaches to the card edge itself
  const shape = new THREE.Shape(), sx = -CW / 2, sy = -CH / 2;
  shape.moveTo(sx + CR, sy); shape.lineTo(sx + CW - CR, sy); shape.quadraticCurveTo(sx + CW, sy, sx + CW, sy + CR);
  shape.lineTo(sx + CW, sy + CH - CR); shape.quadraticCurveTo(sx + CW, sy + CH, sx + CW - CR, sy + CH);
  shape.lineTo(sx + CR, sy + CH); shape.quadraticCurveTo(sx, sy + CH, sx, sy + CH - CR);
  shape.lineTo(sx, sy + CR); shape.quadraticCurveTo(sx, sy, sx + CR, sy);
  const face = new THREE.ShapeGeometry(shape, 10);
  { const p = face.attributes.position, u = face.attributes.uv;
    for (let i = 0; i < p.count; i++) u.setXY(i, (p.getX(i) + CW / 2) / CW, (p.getY(i) + CH / 2) / CH); }
  const mat = map => new THREE.MeshPhysicalMaterial({ map, roughness: .38, metalness: .05, clearcoat: .8, clearcoatRoughness: .2 });
  const front = new THREE.Mesh(face, mat(F.t)); front.position.z = DEP / 2 + .2;
  const back = new THREE.Mesh(face, mat(K.t)); back.position.z = -(DEP / 2 + .2); back.rotation.y = Math.PI;
  const edgeGeo = new THREE.ExtrudeGeometry(shape, { depth: DEP, bevelEnabled: false, curveSegments: 10 }); edgeGeo.translate(0, 0, -DEP / 2);
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0c0406, roughness: .6 });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  const card = new THREE.Group(); card.rotation.order = 'ZYX';
  card.add(front, back, edge); scene.add(card);

  const SEG = 28, rg = new THREE.BufferGeometry();
  const rpos = new Float32Array((SEG + 1) * 6), ruv = new Float32Array((SEG + 1) * 4), ridx = [];
  for (let i = 0; i < SEG; i++) { const a = i * 2; ridx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3)); rg.setAttribute('uv', new THREE.BufferAttribute(ruv, 2)); rg.setIndex(ridx);
  const ribbon = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: strapTex, side: THREE.DoubleSide }));
  ribbon.position.z = 0; ribbon.frustumCulled = false; scene.add(ribbon);

  /* ---------------- verlet rope + card ---------------- */
  const LINK = 34;                                       // px per rope link at scale 1
  const pt = (x, y, w) => ({ x, y, px: x, py: y, w });
  const P = [pt(AX, AY, 0), pt(AX + 8, AY + LINK, 1), pt(AX + 16, AY + LINK * 2, 1), pt(AX + 24, AY + LINK * 3, 1), pt(AX + 34, AY + LINK * 4, .7)];
  const B = pt(AX + 70, AY + LINK * 4 + CH + CLIP, .25);   // card bottom; heavier than the rope so it hangs and swings
  const all = [...P, B];
  let sc = base, spin = 0, spinV = 0, drag = null, wasHover = false, suppress = false;
  const ptr = { x: -999, y: -999 };

  function constrain(a, b, len) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, k = (d - len) / d, w = a.w + b.w;
    if (!w) return; a.x += dx * k * a.w / w; a.y += dy * k * a.w / w; b.x -= dx * k * b.w / w; b.y -= dy * k * b.w / w;
  }
  function sim(h, t) {
    const L = LINK * sc, H = (CH + CLIP) * sc;
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
    return ray.intersectObjects([front, back, edge], false).length > 0;
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
      const reach = (LINK * 4 + (CH + CLIP)) * sc * .985;
      let tx = ptr.x + drag.ox, ty = ptr.y + drag.oy, dx = tx - AX, dy = ty - AY, d = Math.hypot(dx, dy);
      if (d > reach) { tx = AX + dx / d * reach; ty = AY + dy / d * reach; }
      const ox = B.x, oy = B.y; B.x += (tx - B.x) * .55; B.y += (ty - B.y) * .55; B.px = ox; B.py = oy; B.w = 0;
    }
    while (acc >= 1 / 120) { sim(1 / 120, now); acc -= 1 / 120; }

    // card pose: hangs from the clip (top of the rope), tilt follows the rope direction
    const T = P[4], dx = B.x - T.x, dy = B.y - T.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, mid = (CLIP + CH / 2) / (CLIP + CH);
    const cx = T.x + dx * mid, cy = T.y + dy * mid;
    spinV += (cx - (card.userData.cx ?? cx)) * .012 - spin * .06; spinV *= .94; spin = Math.max(-1.1, Math.min(1.1, spin + spinV));   // swing -> spin, eased back to face front
    card.userData.cx = cx;
    card.position.set(cx, -cy, 0); card.scale.setScalar(sc);
    card.rotation.z = -Math.atan2(ux, uy); card.rotation.y = spin;

    // strap: smooth curve through the rope points, drawn as a textured ribbon
    const inside = new THREE.Vector3(T.x + ux * 16 * sc, -(T.y + uy * 16 * sc), 0);
    const curve = new THREE.CatmullRomCurve3([...P.map(v3), inside], false, 'centripetal');
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
