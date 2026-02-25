/* ─────────────────────────────────────────────
   ZIVU CREATIVE — config.js
   ───────────────────────────────────────────── */

const CONFIG = {

  /* ── Particle count ────────────────────────── */
  PEAK_COUNT: 12,

  /* ── Spawn ─────────────────────────────────── */
  SPAWN_X_OFFSET: 0.33,
  SPAWN_X_SPREAD: 0.08,

  /* ── Size (fraction of viewport height) ────── */
  START_SIZE: { min: 0.02, max: 0.05 },
  MAX_SIZE:   { min: 0.20, max: 0.42 },

  /* ── Fade in ──────────────────────────────── */
  FADE_IN_DURATION: 0.9,

  /* ── Travel ───────────────────────────────── */
  VELOCITY: { min: 0.014, max: 0.030 },

  /* ── Funnel spread ────────────────────────── */
  SPAWN_Y_CENTER: 0.50,
  SPAWN_Y_SPREAD: 0.08,
  MAX_Y_SPREAD:   0.44,

  /* ── Y drift ──────────────────────────────── */
  Y_DRIFT_SPEED: 0.18,

  /* ── Color ────────────────────────────────── */
  WHITE_PROBABILITY: 0.75,
  COLOR_WHITE: 0xffffff,
  COLOR_DARK:  0x050505,

  /* ── Squircle geometry ────────────────────── */
  SQUIRCLE_EXPONENT: { min: 2.5, max: 4.5 },
  VERTEX_NOISE:      { min: 0.0, max: 0.0 },
  SEGMENTS:          { min: 80,  max: 120 },
  SHAPE_ASPECT:      { min: 0.82, max: 1.22 },

  /* ── Growth curve ─────────────────────────── */
  GROWTH_EASE: 2.2,

  /* ── Mouse interaction ────────────────────────
     INTERACTION_RADIUS: how wide the disturbance is
     IMPULSE_STRENGTH:   force applied per frame
     VELOCITY_SCALE:     fast cursor = stronger push
     FLOW_RESTORE:       how quickly natural rightward
       flow reasserts after disturbance (per second).
       Very low = long lazy drift back to current.
       Higher = snappier return.                    */
  INTERACTION_RADIUS: 0.18,
  IMPULSE_STRENGTH:   0.18,
  VELOCITY_SCALE:     0.5,
  FLOW_RESTORE:       0.6,
  /* FRICTION: multiplied against vx/vy every frame after any impulse.
     1.0 = no damping, 0.92 = gentle bleed, 0.80 = heavy drag.
     Keeps disturbed particles from travelling too far off course.   */
  FRICTION:           0.92,

  /* ── Particle-to-particle wake propagation ────
     When a particle is disturbed it bleeds some
     of its excess velocity to nearby particles,
     creating a water-wake cascade effect.

     PROP_RADIUS:   how close two particles must be
                    to influence each other
     PROP_STRENGTH: fraction of excess transferred
                    per frame (very small — accumulates
                    over many frames naturally)
     PROP_DECAY:    multiplier on received force so
                    2nd-order hits are weaker than 1st,
                    3rd weaker than 2nd, etc.           */
  PROP_RADIUS:   0.22,
  PROP_STRENGTH: 0.08,
  PROP_DECAY:    0.55,

  /* ── Wake (toggle ON / first visit) ──────────
     Particles scale from 0 → natural size.
     Each gets a random delay in WAKE_DELAY range.
     WAKE_DURATION: how long the scale-up takes.   */
  WAKE_DELAY:    { min: 0.0,  max: 0.15 },
  WAKE_DURATION: { min: 0.4,  max: 0.8  },

  /* ── Poof (toggle OFF) ────────────────────────
     Particles burst outward and shrink to zero.
     POOF_SPEED: outward velocity of burst
     POOF_DURATION: how long shrink takes per particle
     POOF_SPIN: slight random rotational nudge (radians) */
  POOF_SPEED:    { min: 0.08, max: 0.28 },
  POOF_DURATION: { min: 0.35, max: 0.95 },

  /* ── Render ──────────────────────────────────── */
  BACKGROUND: 0x161616,
  ANTIALIAS: true,
  PIXEL_RATIO_CAP: 2,

  /* ── Stencil render order ───────────────────── */
  RENDER_ORDER: {
    STENCIL_WRITE: 0,
    SOLID_COLOR:   1,
    IMAGE_REVEAL:  2,
  },

};