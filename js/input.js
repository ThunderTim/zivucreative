/* ─────────────────────────────────────────────
   ZIVU CREATIVE — input.js
   Unified pointer events (mouse + touch + stylus).

   pointermove fires on hover (desktop) AND drag
   (touch) — replacing separate mousemove/touchmove
   listeners fixes touch-only-on-drag behaviour.

   pointerdown captures position on first contact
   so force applies immediately, not just on move.
   ───────────────────────────────────────────── */

const Input = (() => {

  let x  = -1,  y  = -1;   // -1 = off screen until first event
  let px = -1,  py = -1;
  let vx = 0,   vy = 0;
  let active = false;       // pointer is currently on screen

  function init() {
    window.addEventListener('pointermove',  _onMove);
    window.addEventListener('pointerdown',  _onMove);   // capture on first touch
    window.addEventListener('pointerup',    _onLeave);
    window.addEventListener('pointerleave', _onLeave);
  }

  function _onMove(e) {
    active = true;
    x = e.clientX / window.innerWidth;
    y = 1 - e.clientY / window.innerHeight;  // flip Y for Three.js coords
  }

  function _onLeave() {
    active = false;
    vx = 0;
    vy = 0;
  }

  function update(dt) {
    if (!active || dt <= 0 || px < 0) {
      px = x; py = y;
      return;
    }

    const rawVx = (x - px) / dt;
    const rawVy = (y - py) / dt;

    vx = vx + (rawVx - vx) * 0.25;
    vy = vy + (rawVy - vy) * 0.25;

    px = x;
    py = y;
  }

  function getPosition() { return { x, y }; }
  function getVelocity() { return { vx, vy }; }
  function isActive()    { return active; }

  return { init, update, getPosition, getVelocity, isActive };

})();