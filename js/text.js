/* ─────────────────────────────────────────────
   ZIVU CREATIVE — text.js

   One canvas, one texture, two color-tinted meshes.
   show()/hide() fade opacity. update(dt) drives it.
   ───────────────────────────────────────────── */

const Text = (() => {

  let texture, canvas, ctx;
  let matBg, matShape;
  let opacity       = 1;
  let targetOpacity = 1;
  const FADE_SPEED  = 3.5;   // opacity units/sec → ~280ms fade

  function init() {
    canvas = document.createElement('canvas');
    ctx    = canvas.getContext('2d');

    texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const geo = new THREE.PlaneGeometry(1, 1);

    // White tint → white text on background (stencil = 0)
    matBg = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, depthWrite: false, color: 0xffffff,
    });

    // Black tint → black text inside shapes (stencil >= 1)
    matShape = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, depthWrite: false, color: 0x000000,
    });

    const meshBg    = new THREE.Mesh(geo, matBg);
    const meshShape = new THREE.Mesh(geo, matShape);
    meshBg.position.set(0.5, 0.5, 5);
    meshShape.position.set(0.5, 0.5, 5);

    Scene.getTextBgScene().add(meshBg);
    Scene.getTextShapeScene().add(meshShape);

    requestAnimationFrame(_redraw);
    window.addEventListener('resize', () => requestAnimationFrame(_redraw));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => requestAnimationFrame(_redraw));
    }
  }

  /* ── Called each frame from the render loop ── */
  function update(dt) {
    if (opacity === targetOpacity) return;
    const dir = targetOpacity > opacity ? 1 : -1;
    opacity   = Math.min(1, Math.max(0, opacity + dir * FADE_SPEED * dt));
    if (Math.abs(opacity - targetOpacity) < 0.005) opacity = targetOpacity;
    matBg.opacity    = opacity;
    matShape.opacity = opacity;
  }

  function show() { targetOpacity = 1; }
  function hide() { targetOpacity = 0; }

  /* ── Draw canvas — reads exact DOM positions ─ */
  function _redraw() {
    const createEl = document.querySelector('.hero-create');
    const expEl    = document.querySelector('.hero-experiences');
    if (!createEl || !expEl) return;

    const { W, H } = Scene.getSize();
    const dpr = Math.min(window.devicePixelRatio, 2);

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const createRect = createEl.getBoundingClientRect();
    const expRect    = expEl.getBoundingClientRect();
    const createSize = parseFloat(window.getComputedStyle(createEl).fontSize);
    const expSize    = parseFloat(window.getComputedStyle(expEl).fontSize);

    ctx.fillStyle    = '#ffffff';
    ctx.textBaseline = 'top';

    ctx.font = `400 ${createSize}px 'DM Serif Display', serif`;
    ctx.fillText('Create', createRect.left, createRect.top);

    ctx.font = `400 ${expSize}px 'DM Serif Display', serif`;
    ctx.fillText('experiences', expRect.left, expRect.top);

    if (texture) texture.needsUpdate = true;
  }

  return { init, update, show, hide };

})();