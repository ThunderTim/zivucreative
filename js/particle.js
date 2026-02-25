/* ─────────────────────────────────────────────
   ZIVU CREATIVE — particle.js

   State machine:
     SLEEPING → scale=0, waiting for wake()
     LIVE     → normal travel + mouse interaction
     POOFING  → burst outward + shrink to 0 → destroy
   ───────────────────────────────────────────── */

const STATE = { SLEEPING: 0, LIVE: 1, POOFING: 2 };

class Particle {

  constructor(texture, zOrder) {
    this.texture = texture;
    this.zOrder  = zOrder;
    this._buildGeometry();
    this._buildMaterials();
    this._buildMeshes();
    this._initState();
  }

  /* ── Geometry ─────────────────────────────── */
  _buildGeometry() {
    const segments      = rand(CONFIG.SEGMENTS.min,          CONFIG.SEGMENTS.max, true);
    const expo          = rand(CONFIG.SQUIRCLE_EXPONENT.min, CONFIG.SQUIRCLE_EXPONENT.max);
    const aspectStretch = rand(CONFIG.SHAPE_ASPECT.min,      CONFIG.SHAPE_ASPECT.max);

    const positions = [], uvs = [], indices = [];
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cos   = Math.cos(theta);
      const sin   = Math.sin(theta);
      const r = 1 / Math.pow(
        Math.pow(Math.abs(cos), expo) + Math.pow(Math.abs(sin), expo),
        1 / expo
      );
      const x = cos * r * aspectStretch;
      const y = sin * r;
      positions.push(x, y, 0);
      uvs.push((x / aspectStretch + 1) * 0.5, (y + 1) * 0.5);
    }

    for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    this.geometry = geo;
  }

  /* ── Materials ────────────────────────────── */
  _buildMaterials() {
    const isWhite = Math.random() < CONFIG.WHITE_PROBABILITY;
    const color   = isWhite ? CONFIG.COLOR_WHITE : CONFIG.COLOR_DARK;

    this.stencilMat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: false, transparent: true,
    });
    this.solidMat = new THREE.MeshBasicMaterial({
      color, depthWrite: false, transparent: true,
    });
    this.imageMat = new THREE.MeshBasicMaterial({
      map: this.texture || null, depthWrite: false, transparent: true,
    });

    // Shapes appear square on screen — the mesh scale (size/aspect, size)
    // already compensates for screen aspect ratio, so shapeAspect = 1.0.
    // coverFit then only needs to account for the image's own aspect ratio.
    if (this.texture) {
      Assets.coverFit(this.texture, 1.0);
    }
  }

  /* ── Meshes ───────────────────────────────── */
  _buildMeshes() {
    this.stencilMesh = new THREE.Mesh(this.geometry, this.stencilMat);
    this.solidMesh   = new THREE.Mesh(this.geometry, this.solidMat);
    this.imageMesh   = new THREE.Mesh(this.geometry, this.imageMat);

    this.stencilMesh.renderOrder = CONFIG.RENDER_ORDER.STENCIL_WRITE;
    this.solidMesh.renderOrder   = CONFIG.RENDER_ORDER.SOLID_COLOR;
    this.imageMesh.renderOrder   = CONFIG.RENDER_ORDER.IMAGE_REVEAL + this.zOrder * 0.001;

    Scene.getStencilScene().add(this.stencilMesh);
    Scene.getSolidScene().add(this.solidMesh);
    Scene.getImageScene().add(this.imageMesh);
  }

  /* ── Initial state ────────────────────────── */
  _initState() {
    const { W, H } = Scene.getSize();
    this.aspect = W / H;

    this.x       = CONFIG.SPAWN_X_OFFSET + (Math.random() - 0.5) * 2 * CONFIG.SPAWN_X_SPREAD;
    this.y       = CONFIG.SPAWN_Y_CENTER  + (Math.random() - 0.5) * 2 * CONFIG.SPAWN_Y_SPREAD;
    this.targetY = CONFIG.SPAWN_Y_CENTER  + (Math.random() - 0.5) * 2 * CONFIG.MAX_Y_SPREAD;

    const s            = CONFIG.SIZE_SCALE;
    this.startSize     = rand(CONFIG.START_SIZE.min, CONFIG.START_SIZE.max) * s;

    const sizeRange    = Math.random() < CONFIG.SMALL_PROBABILITY
      ? CONFIG.SMALL_MAX_SIZE
      : CONFIG.MAX_SIZE;
    this.maxSize       = rand(sizeRange.min, sizeRange.max) * s;
    this.velocity  = rand(CONFIG.VELOCITY.min,   CONFIG.VELOCITY.max);

    // Actual velocity components — cursor disturbs these directly.
    // vx starts at natural travel speed, vy starts at 0.
    // Flow restore gradually nudges them back toward natural values.
    this.vx = this.velocity;
    this.vy = 0;

    // Lifecycle
    this.state   = STATE.SLEEPING;
    this.opacity = 0;
    this.size    = 0;
    this.fadeAge = 0;
    this.alive   = true;

    // Wake params — randomised per particle for staggered entrance
    this.wakeDelay    = rand(CONFIG.WAKE_DELAY.min,    CONFIG.WAKE_DELAY.max);
    this.wakeDuration = rand(CONFIG.WAKE_DURATION.min, CONFIG.WAKE_DURATION.max);
    this.wakeTimer    = 0;

    // Poof params
    this.poofVX       = 0;
    this.poofVY       = 0;
    this.poofTimer    = 0;
    this.poofDuration = 0;
    this.sizeAtPoof   = 0;

    this._applyTransform();
  }

  /* ── Public: wake() ───────────────────────── */
  wake() {
    if (this.state !== STATE.SLEEPING) return;
    this.wakeTimer = 0;  // countdown begins now
  }

  /* ── Public: poof() ───────────────────────── */
  poof() {
    if (this.state === STATE.POOFING || !this.alive) return;
    this.state        = STATE.POOFING;
    this.sizeAtPoof   = this.size;
    this.poofTimer    = 0;
    this.poofDuration = rand(CONFIG.POOF_DURATION.min, CONFIG.POOF_DURATION.max);

    // Random burst direction
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(CONFIG.POOF_SPEED.min, CONFIG.POOF_SPEED.max);
    this.poofVX = Math.cos(angle) * speed;
    this.poofVY = Math.sin(angle) * speed;
  }

  /* ── Public: applyImpulse() ───────────────── */
  applyImpulse(cursor, vel) {
    if (this.state !== STATE.LIVE) return;

    // Aspect-corrected distance so radius feels circular on screen
    const dx   = (this.x - cursor.x) * this.aspect;
    const dy   = this.y - cursor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > CONFIG.INTERACTION_RADIUS || dist < 0.001) return;

    // Smooth cubic falloff — wide soft area, not a sharp boundary
    const proximity = 1 - dist / CONFIG.INTERACTION_RADIUS;
    const weight    = proximity * proximity * proximity;

    const cursorSpeed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    const magnitude   = weight * CONFIG.IMPULSE_STRENGTH
                        * (1 + cursorSpeed * CONFIG.VELOCITY_SCALE);

    // Push direction away from cursor — disturb actual velocity
    const nx = dx / dist;
    const ny = dy / dist;

    this.vx += nx * magnitude;
    this.vy += ny * magnitude;
  }

  /* ── Update ───────────────────────────────── */
  update(dt) {
    if (!this.alive) return;
    switch (this.state) {
      case STATE.SLEEPING: this._updateSleeping(dt); break;
      case STATE.LIVE:     this._updateLive(dt);     break;
      case STATE.POOFING:  this._updatePoofing(dt);  break;
    }
  }

  _updateSleeping(dt) {
    this.wakeTimer += dt;
    if (this.wakeTimer < this.wakeDelay) return;

    const elapsed  = this.wakeTimer - this.wakeDelay;
    const progress = Math.min(1, elapsed / this.wakeDuration);
    const eased    = _easeOutCubic(progress);

    // Move during wake — particle travels and drifts while scaling up
    // so motion and appearance are simultaneous, not sequential
    this.x += this.vx * dt;
    const driftStrength = CONFIG.Y_DRIFT_SPEED * (1 - Math.min(this.x, 0.8));
    this.y += (this.targetY - this.y) * driftStrength * dt;

    // Scale and opacity grow together
    const xProgress   = Math.max(0, Math.min(1, this.x));
    const growEased   = Math.pow(xProgress, 1 / CONFIG.GROWTH_EASE);
    const naturalSize = this.startSize + (this.maxSize - this.startSize) * growEased;

    this.size    = naturalSize * eased;
    this.opacity = eased;

    if (progress >= 1) {
      this.state   = STATE.LIVE;
      this.fadeAge = CONFIG.FADE_IN_DURATION;
    }

    this._applyTransform();
  }

  _updateLive(dt) {
    this.fadeAge += dt;

    // Refresh aspect each frame — handles iOS chrome show/hide
    // which changes viewport height without destroying particles
    const { W, H } = Scene.getSize();
    this.aspect = W / H;

    const driftStrength = CONFIG.Y_DRIFT_SPEED * (1 - Math.min(this.x, 0.8));
    const naturalVY     = (this.targetY - this.y) * driftStrength;

    const exX = this.vx - this.velocity;
    const exY = this.vy - naturalVY;

    const decayedExX = exX * CONFIG.FRICTION;
    const decayedExY = exY * CONFIG.FRICTION;

    const restore = CONFIG.FLOW_RESTORE * dt;
    const restoredExX = decayedExX * (1 - restore);
    const restoredExY = decayedExY * (1 - restore);

    this.vx = this.velocity + restoredExX;
    this.vy = naturalVY    + restoredExY;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const progress = Math.max(0, Math.min(1, this.x));
    const eased    = Math.pow(progress, 1 / CONFIG.GROWTH_EASE);
    this.size      = this.startSize + (this.maxSize - this.startSize) * eased;

    // Fade in on spawn, fade out smoothly before right edge
    const fadeIn  = Math.min(1, this.fadeAge / CONFIG.FADE_IN_DURATION);
    const fadeOut = this.x > CONFIG.FADE_OUT_START
      ? 1 - (this.x - CONFIG.FADE_OUT_START) / (1.18 - CONFIG.FADE_OUT_START)
      : 1;
    this.opacity = Math.min(fadeIn, Math.max(0, fadeOut));

    if (this.x > 1.18) { this.destroy(); return; }

    this._applyTransform();
  }

  _updatePoofing(dt) {
    this.poofTimer += dt;
    const t    = Math.min(1, this.poofTimer / this.poofDuration);
    const ease = 1 - t * t;  // decelerate the burst

    this.x += this.poofVX * ease * dt;
    this.y += this.poofVY * ease * dt;

    this.size    = this.sizeAtPoof * (1 - _easeInCubic(t));
    this.opacity = 1 - _easeInCubic(t);

    if (t >= 1) { this.destroy(); return; }

    this._applyTransform();
  }

  /* ── Excess velocity — how far from natural flow ─
     Used by system.js for particle-to-particle wake. */
  getExcess() {
    const driftStrength = CONFIG.Y_DRIFT_SPEED * (1 - Math.min(this.x, 0.8));
    const naturalVY     = (this.targetY - this.y) * driftStrength;
    return {
      ex: this.vx - this.velocity,
      ey: this.vy - naturalVY,
    };
  }

  /* ── Receive propagated wake from a neighbour ────
     force is already scaled by distance + PROP_DECAY. */
  receiveWake(ex, ey) {
    if (this.state !== STATE.LIVE) return;
    this.vx += ex;
    this.vy += ey;
  }
  _applyTransform() {
    const scaleX   = this.size / this.aspect;
    const scaleY   = this.size;
    const z        = (this.zOrder % 100) * 0.08 - 4;
    const visible  = this.opacity > 0;

    [this.stencilMesh, this.solidMesh, this.imageMesh].forEach(mesh => {
      mesh.visible  = visible;
      mesh.position.set(this.x, this.y, z);
      mesh.scale.set(scaleX, scaleY, 1);
      mesh.material.opacity = this.opacity;
    });
  }

  /* ── Destroy ──────────────────────────────── */
  destroy() {
    this.alive = false;
    Scene.getStencilScene().remove(this.stencilMesh);
    Scene.getSolidScene().remove(this.solidMesh);
    Scene.getImageScene().remove(this.imageMesh);
    this.geometry.dispose();
    this.stencilMat.dispose();
    this.solidMat.dispose();
    this.imageMat.dispose();
  }

  isAlive() { return this.alive; }
}

/* ── Easing ───────────────────────────────── */
function _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function _easeInCubic(t)  { return t * t * t; }

/* ── rand ─────────────────────────────────── */
function rand(min, max, integer = false) {
  const v = min + Math.random() * (max - min);
  return integer ? Math.round(v) : v;
}