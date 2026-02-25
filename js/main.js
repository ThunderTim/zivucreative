/* ─────────────────────────────────────────────
   ZIVU CREATIVE — main.js
   UI interactions: toggle + email button.
   ───────────────────────────────────────────── */


/* ═══════════════════════════════════════════════
   TOGGLE
   On → wake particles (scale up from 0)
   Off → poof particles (burst + shrink away)
═══════════════════════════════════════════════ */
(function initToggle() {
  const CSS_DURATION = 340;   // matches CSS transition in styles.css

  const toggleEl  = document.getElementById('toggle');
  const toggleBtn = document.getElementById('toggle-btn');
  const viewC     = document.getElementById('view-creative');
  const viewI     = document.getElementById('view-info');
  const labelLeft = document.getElementById('label-left');
  const emailBtn  = document.getElementById('email-btn');

  let isOn      = false;
  let animating = false;

  function doToggle() {
    if (animating) return;
    animating = true;

    isOn = !isOn;
    toggleEl.classList.toggle('is-on', isOn);
    toggleBtn.setAttribute('aria-checked', String(isOn));

    if (isOn) {
      // Going to info — fade text + poof particles, then swap view
      Text.hide();
      ParticleSystem.poof();
      setTimeout(() => {
        _showView('info');
        animating = false;
      }, CSS_DURATION);

    } else {
      // Coming back to creative — swap view, then wake particles + text
      _showView('creative');
      setTimeout(() => {
        ParticleSystem.wake();
        Text.show();
        animating = false;
      }, CSS_DURATION);
    }
  }

  function _showView(which) {
    if (which === 'info') {
      viewC.classList.add('hidden');
      viewI.classList.remove('hidden');
      labelLeft.textContent = 'St. Petersburg, FL  33702';
      emailBtn.classList.add('visible');
    } else {
      viewI.classList.add('hidden');
      viewC.classList.remove('hidden');
      labelLeft.textContent = 'Zivu Creative Development';
      emailBtn.classList.remove('visible');
    }
  }

  toggleBtn.addEventListener('click', doToggle);
  toggleBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doToggle(); }
  });
})();


/* ═══════════════════════════════════════════════
   EMAIL BUTTON
   Click opens mailto — address assembled at runtime.
═══════════════════════════════════════════════ */
(function initEmail() {
  document.getElementById('email-btn').addEventListener('click', () => {
    location.href = 'mail' + 'to:' + 'contact' + '@' + 'zivucreative.com';
  });
})();