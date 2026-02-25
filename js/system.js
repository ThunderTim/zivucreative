/* ─────────────────────────────────────────────
   ZIVU CREATIVE — system.js
   Manages the particle pool.

   System states:
     DORMANT  → no particles, waiting for first wake
     RUNNING  → spawning + updating normally
     POOFING  → all particles poofing, no new spawns
   ───────────────────────────────────────────── */

const SYS = { DORMANT: 0, RUNNING: 1, POOFING: 2 };

const ParticleSystem = (() => {

  const particles = [];
  let   zCounter  = 0;
  let   sysState  = SYS.DORMANT;
  let   spawnTimer    = 0;
  let   spawnInterval = 0;

  let firstWake = true;   // first visit gets a slightly faster fill rate

  /* ── Init ───────────────────────────────────── */
  function init() {
    _updateSpawnInterval();

    // Pre-seed a small number of sleeping particles spread across
    // the screen so it's not empty on first wake. 3 feels natural —
    // enough to establish the scene without a burst feeling.
    const seedCount = 3;
    for (let i = 0; i < seedCount; i++) {
      const x = CONFIG.SPAWN_X_OFFSET
              + (i / (seedCount - 1)) * (0.82 - CONFIG.SPAWN_X_OFFSET);
      const p = new Particle(Assets.next(), zCounter++);
      p.x = x;
      particles.push(p);
    }
  }

  /* ── Wake ───────────────────────────────────── */
  function wake() {
    sysState   = SYS.RUNNING;
    spawnTimer = 0;

    if (firstWake) {
      // First visit: accelerate initial fill so screen isn't empty long,
      // but still trickles in one-by-one rather than all at once.
      // After peak is reached the rate returns to normal.
      spawnInterval = spawnInterval * 0.35;
      firstWake = false;
    } else {
      _updateSpawnInterval();
    }

    // Wake any particles that survived (e.g. re-toggle before poof finished)
    particles.forEach(p => p.wake());
  }

  /* ── Poof — called on toggle OFF ────────────────
     All live particles burst and shrink away.
     Spawning stops until wake() is called again.   */
  function poof() {
    sysState = SYS.POOFING;
    particles.forEach(p => p.poof());
  }

  /* ── Update — called each frame ─────────────── */
  function update(dt) {
    Input.update(dt);

    const cursor = Input.getPosition();
    const vel    = Input.getVelocity();

    // 1. Apply cursor impulse only when pointer is on screen
    if (Input.isActive()) {
      for (let i = 0; i < particles.length; i++) {
        particles[i].applyImpulse(cursor, vel);
      }
    }

    // 2. Particle-to-particle wake propagation ──────
    // Each disturbed particle bleeds its excess velocity
    // to nearby particles at a decayed rate.
    // Running this once per frame means 2nd/3rd order
    // effects emerge naturally over subsequent frames —
    // the newly disturbed particles become sources next frame.
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const a = particles[i];
      if (!a.isAlive()) continue;

      const { ex, ey } = a.getExcess();
      const excessMag  = Math.sqrt(ex * ex + ey * ey);
      if (excessMag < 0.0005) continue;   // skip if barely disturbed

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const b = particles[j];
        if (!b.isAlive()) continue;

        // Aspect-corrected distance
        const dx   = (b.x - a.x) * (a.aspect || 1);
        const dy   = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= CONFIG.PROP_RADIUS || dist < 0.001) continue;

        // Proximity weight — cubic falloff, strongest when close
        const t      = 1 - dist / CONFIG.PROP_RADIUS;
        const weight = t * t * t;

        // Transfer a fraction of A's excess to B, decayed
        const transfer = weight * CONFIG.PROP_STRENGTH * CONFIG.PROP_DECAY;
        b.receiveWake(ex * transfer, ey * transfer);
      }
    }

    // 3. Update all particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update(dt);
      if (!particles[i].isAlive()) particles.splice(i, 1);
    }

    // 4. Spawn new particles when RUNNING
    if (sysState === SYS.RUNNING && particles.length < CONFIG.PEAK_COUNT) {
      spawnTimer += dt;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        _spawnLiveAt(CONFIG.SPAWN_X_OFFSET);
        _updateSpawnInterval();
      }
    }
  }

  /* ── Spawn helpers ───────────────────────────── */

  function _spawnLiveAt(x) {
    const p = new Particle(Assets.next(), zCounter++);
    p.x = x;
    p.wake();   // starts wake countdown immediately with its randomised delay
    particles.push(p);
  }

  function _updateSpawnInterval() {
    const avgVelocity = (CONFIG.VELOCITY.min + CONFIG.VELOCITY.max) / 2;
    const avgLifetime = 1.15 / avgVelocity;
    spawnInterval = (avgLifetime / CONFIG.PEAK_COUNT) * rand(0.7, 1.4);
  }

  return { init, wake, poof, update };

})();