/* ─────────────────────────────────────────────
   ZIVU CREATIVE — scene.js

   5-pass stencil pipeline:

   Pass 1  stencilScene    write stencil (no color)
   Pass 2  solidScene      solid shapes  stencil == 1
   Pass 3  imageScene      textures      stencil >= 2
   Pass 4  textBgScene     white text    stencil == 0  (background)
   Pass 5  textShapeScene  black text    stencil >= 1  (inside shapes)
   ───────────────────────────────────────────── */

const Scene = (() => {

  let renderer, camera;
  let stencilScene, solidScene, imageScene, textBgScene, textShapeScene;
  let W = window.innerWidth;
  let H = window.innerHeight;

  function init() {
    stencilScene    = new THREE.Scene();
    solidScene      = new THREE.Scene();
    imageScene      = new THREE.Scene();
    textBgScene     = new THREE.Scene();
    textShapeScene  = new THREE.Scene();

    camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);

    renderer = new THREE.WebGLRenderer({
      antialias: CONFIG.ANTIALIAS,
      stencil:   true,
      alpha:     false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.PIXEL_RATIO_CAP));
    renderer.setSize(W, H);
    renderer.setClearColor(CONFIG.BACKGROUND, 1);
    renderer.autoClear = false;

    renderer.domElement.style.cssText =
      'position:fixed;inset:0;z-index:0;display:block;';
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    window.addEventListener('resize', _onResize);
  }

  function _onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H);
  }

  function render() {
    const gl = renderer.getContext();

    renderer.clear(true, true, true);
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.STENCIL_TEST);

    // ── Pass 1: Write stencil ──────────────────
    gl.colorMask(false, false, false, false);
    gl.stencilMask(0xFF);
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
    renderer.render(stencilScene, camera);

    // ── Pass 2: Solid shapes (stencil == 1) ────
    gl.colorMask(true, true, true, true);
    gl.stencilMask(0x00);
    gl.stencilFunc(gl.EQUAL, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    renderer.render(solidScene, camera);

    // ── Pass 3: Image reveal (stencil >= 2) ────
    gl.stencilMask(0xFF);
    gl.stencilFunc(gl.LEQUAL, 2, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
    renderer.render(imageScene, camera);

    // ── Pass 4: White text on background ───────
    // stencil == 0 → only background pixels
    gl.stencilMask(0x00);
    gl.stencilFunc(gl.EQUAL, 0, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    renderer.render(textBgScene, camera);

    // ── Pass 5: Black text inside shapes ───────
    // stencil >= 1 → all shape pixels (LEQUAL ref=1)
    gl.stencilFunc(gl.LEQUAL, 1, 0xFF);
    renderer.render(textShapeScene, camera);

    gl.disable(gl.STENCIL_TEST);
  }

  function start(onTick) {
    let lastTime = performance.now();
    let visible  = true;

    document.addEventListener('visibilitychange', () => {
      visible  = !document.hidden;
      if (visible) lastTime = performance.now(); // reset dt on resume
    });

    (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      onTick(dt);
      render();
    })(performance.now());
  }

  function getStencilScene()   { return stencilScene; }
  function getSolidScene()     { return solidScene; }
  function getImageScene()     { return imageScene; }
  function getTextBgScene()    { return textBgScene; }
  function getTextShapeScene() { return textShapeScene; }
  function getSize()           { return { W, H }; }

  return {
    init, start,
    getStencilScene, getSolidScene, getImageScene,
    getTextBgScene, getTextShapeScene,
    getSize,
  };

})();