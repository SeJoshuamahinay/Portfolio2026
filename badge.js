// ID card on a lanyard in the top-left nav.
// Rebuilds Vercel's "interactive 3D event badge" (react-three-fiber + Rapier) in plain three.js:
// fixed anchor -> 3 rope-jointed balls -> spherical joint -> card, gravity -40, damping 2, kinematic drag,
// tilt correction (angvel.y -= rot.y * 0.25), and a smoothed Catmull-Rom strap drawn from the joints.
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
  const cam = new THREE.OrthographicCamera(0, 1, 0, -1, .1, 1200);   // 1 unit = 1 css px, y up
  cam.position.z = 600;                                                // in front of the card, so hit-test rays reach its face
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.position.set(-160, 240, 420); scene.add(sun);

  let cw = 280, ch = 560, base = 1, AX = 90;
  const AY = -16;                                       // anchor sits just above the viewport top
  function fit() {
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    renderer.setSize(cw, ch, false);
    cam.right = cw; cam.bottom = -ch; cam.updateProjectionMatrix();
    base = Math.min(1, Math.max(.62, innerHeight / 900)) * (innerWidth < 760 ? .8 : 1);
    AX = innerWidth * .05 + (innerWidth < 760 ? 52 : 74);   // card centre lines up with the page margin
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

  const SEGS = 28, rg = new THREE.BufferGeometry();
  const rpos = new Float32Array((SEGS + 1) * 6), ruv = new Float32Array((SEGS + 1) * 4), ridx = [];
  for (let i = 0; i < SEGS; i++) { const a = i * 2; ridx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3)); rg.setAttribute('uv', new THREE.BufferAttribute(ruv, 2)); rg.setIndex(ridx);
  const ribbon = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: strapTex, side: THREE.DoubleSide }));
  ribbon.position.z = 0; ribbon.frustumCulled = false; scene.add(ribbon);

  /* ---------------- physics: Vercel's rig on Rapier ---------------- */
  const RAPIER = await import('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js').then(m => m.default).catch(() => null);
  if (RAPIER) await RAPIER.init();
  const U = 88.9;                    // px per physics unit: the card is 1.6 x 2.25 units like theirs
  const SEG = .45, ANCH = 1.1;       // rope link length (theirs is 1; shorter so the lace fits the nav) / joint height on the card
  const V = (x, y, z = 0) => ({ x, y, z });
  let world, fixed, j1, j2, j3, cardBody;
  if (RAPIER) {
    world = new RAPIER.World(V(0, -40, 0));
    const dyn = (x, y) => world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, 0)
      .setLinearDamping(2).setAngularDamping(2).enabledTranslations(true, true, false).setCanSleep(true));
    fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0));
    j1 = dyn(SEG, 0); j2 = dyn(SEG * 2, 0); j3 = dyn(SEG * 3, 0);
    cardBody = dyn(SEG * 3 + .6, 0);                                     // starts off to the side, so it drops in and swings
    // colliders give the bodies their mass; groups are set so the parts don't collide with each other
    // (the lace is anchored right at the card's top edge, so the end ball would otherwise sit inside the card and lock its spin)
    const NOCOLLIDE = 0x00010000;
    [j1, j2, j3].forEach(b => world.createCollider(RAPIER.ColliderDesc.ball(.1).setCollisionGroups(NOCOLLIDE), b));
    world.createCollider(RAPIER.ColliderDesc.cuboid(.8, 1.125, .01).setCollisionGroups(NOCOLLIDE), cardBody);
    const rope = (a, b) => world.createImpulseJoint(RAPIER.JointData.rope(SEG, V(0, 0), V(0, 0)), a, b, true);
    rope(fixed, j1); rope(j1, j2); rope(j2, j3);
    world.createImpulseJoint(RAPIER.JointData.spherical(V(0, 0), V(0, ANCH)), j3, cardBody, true);
  } else {                                                                // no physics available: hang still
    const still = (x, y) => ({ translation: () => V(x, y), rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }), wakeUp() {} });
    fixed = still(0, 0); j1 = still(0, -SEG); j2 = still(0, -SEG * 2); j3 = still(0, -SEG * 3); cardBody = still(0, -SEG * 3 - ANCH);
  }

  let sc = base, drag = null, wasHover = false, suppress = false, down = null;
  const ptr = { x: -999, y: -999 };
  // px (canvas, y down) <-> physics world (y up, origin at the anchor)
  const wx = px => (px - AX) / (U * sc), wy = py => (AY - py) / (U * sc);
  const toPx = (p, out = new THREE.Vector3()) => out.set(AX + p.x * U * sc, -AY + p.y * U * sc, 0);

  /* ---------------- interaction (pointer down on the card -> kinematic drag) ---------------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(px, py) {
    if (px < 0 || py < 0 || px > cw || py > ch) return false;
    ndc.set(px / cw * 2 - 1, 1 - py / ch * 2); ray.setFromCamera(ndc, cam);
    return ray.intersectObjects([front, back, edge], false).length > 0;
  }
  const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  addEventListener('pointermove', e => {
    const [x, y] = local(e); ptr.x = x; ptr.y = y;
    const h = drag ? true : hit(x, y); window.__badgeHover = h;
    if (cursorEl) { if (h) cursorEl.classList.add('link'); else if (wasHover) cursorEl.classList.remove('link'); }
    wasHover = h;
  });
  addEventListener('pointerdown', e => {
    if (!RAPIER) return;
    const [x, y] = local(e);
    if (!hit(x, y)) return;
    const c = cardBody.translation();
    drag = { x: wx(x) - c.x, y: wy(y) - c.y };                          // grab offset, so the card doesn't jump to the pointer
    cardBody.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    down = { x: e.clientX, y: e.clientY, t: performance.now() }; suppress = true;
    document.body.style.userSelect = 'none';
  });
  const release = () => {
    if (!drag) return; drag = null;
    cardBody.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    document.body.style.userSelect = '';
    setTimeout(() => { suppress = false; }, 350);
  };
  addEventListener('pointerup', e => {
    if (!drag) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 400;
    release();
    if (moved < 6 && quick) {                                            // a tap: go home
      const href = canvas.dataset.href;
      if (href) location.href = href; else if (window.lenis) window.lenis.scrollTo(0); else scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  addEventListener('pointercancel', release);
  addEventListener('click', e => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);   // don't click through to the page under the card
  addEventListener('themechange', () => { paintCard(); edgeMat.color.setHex(palette().edge); });
  paintCard(); edgeMat.color.setHex(palette().edge);

  /* ---------------- strap ---------------- */
  const smooth = [j1, j2].map(b => ({ b, p: new THREE.Vector3(b.translation().x, b.translation().y, 0) }));
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const MIN_SPEED = 10, MAX_SPEED = 50;                                  // Vercel's lerp range for the two middle joints
  const qCard = new THREE.Quaternion(), inside = new THREE.Vector3();

  /* ---------------- frame ---------------- */
  let last = performance.now(), shown = false;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;

    // shrink toward the nav as the page scrolls so it stops covering content
    const tt = canvas.dataset.compact !== undefined ? 1 : Math.min(1, scrollY / (innerHeight * .6)), e = tt * tt * (3 - 2 * tt);   // compact pages start small
    sc += (base * (1 - .48 * e) - sc) * .08;

    if (RAPIER) {
      if (drag) {                                                        // follow the pointer, clamped to what the rope can reach
        [cardBody, j1, j2, j3, fixed].forEach(b => b.wakeUp());
        let tx = wx(ptr.x) - drag.x, ty = wy(ptr.y) - drag.y; const reach = SEG * 3 + ANCH + .05, d = Math.hypot(tx, ty);
        if (d > reach) { tx *= reach / d; ty *= reach / d; }
        cardBody.setNextKinematicTranslation(V(tx, ty, 0));
      }
      world.timestep = Math.min(dt, 1 / 30); world.step();
      const ang = cardBody.angvel(), rot = cardBody.rotation();           // keep the card facing the viewer
      cardBody.setAngvel(V(ang.x, ang.y - rot.y * .25, ang.z), true);
    }

    // card pose
    const c = cardBody.translation(), r = cardBody.rotation();
    toPx(c, card.position); card.quaternion.set(r.x, r.y, r.z, r.w); card.scale.setScalar(sc);

    // strap: Catmull-Rom through j3 -> j2 -> j1 -> anchor, the middle joints smoothed so a hard pull doesn't jitter
    smooth.forEach(s => { const t = s.b.translation(), d = s.p.distanceTo(new THREE.Vector3(t.x, t.y, 0));
      s.p.lerp(new THREE.Vector3(t.x, t.y, 0), Math.min(1, dt * (MIN_SPEED + clamp01(d) * (MAX_SPEED - MIN_SPEED)))); });
    const t3 = j3.translation();
    qCard.set(r.x, r.y, r.z, r.w); inside.set(0, -.2, 0).applyQuaternion(qCard);          // end of the lace tucks into the card's top edge
    const pts = [
      toPx({ x: t3.x + inside.x, y: t3.y + inside.y }), toPx(t3), toPx(smooth[1].p), toPx(smooth[0].p), toPx(fixed.translation())
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'chordal'), samples = curve.getPoints(SEGS), halfW = 8 * Math.max(.7, sc); let dist = 0;
    for (let i = 0; i <= SEGS; i++) {
      const a = samples[Math.max(0, i - 1)], b = samples[Math.min(SEGS, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (i) dist += samples[i].distanceTo(samples[i - 1]);
      const nx = -ty * halfW, ny = tx * halfW, o = i * 6;
      rpos[o] = samples[i].x + nx; rpos[o + 1] = samples[i].y + ny; rpos[o + 2] = 0; rpos[o + 3] = samples[i].x - nx; rpos[o + 4] = samples[i].y - ny; rpos[o + 5] = 0;
      const u = dist / 230; ruv[i * 4] = u; ruv[i * 4 + 1] = 0; ruv[i * 4 + 2] = u; ruv[i * 4 + 3] = 1;
    }
    rg.attributes.position.needsUpdate = true; rg.attributes.uv.needsUpdate = true;

    renderer.render(scene, cam);
    if (!shown) { shown = true; root.classList.add('badge-on'); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
