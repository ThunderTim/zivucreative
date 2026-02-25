/* ─────────────────────────────────────────────
   ZIVU CREATIVE — assets.js

   Accepts a mixed array of media items:

     String (image path):
       'assets/images/projects/01.jpg'

     Self-hosted video:
       { type: 'video', src: 'assets/video/reel.mp4' }
       → THREE.VideoTexture — plays live in shape

     Vimeo (thumbnail only — CORS prevents live video):
       { type: 'vimeo', id: '351686539' }
       → fetches thumbnail via Vimeo oEmbed API,
         loads it as a static texture

   Usage:
     Assets.load([...items]).then(() => ...)
     Assets.next() → THREE.Texture (or VideoTexture)
   ───────────────────────────────────────────── */

const Assets = (() => {

  const textures = [];
  let   cursor   = 0;

  /* ── Load ─────────────────────────────────── */
  function load(items) {
    const promises = items.map(item => _loadItem(item));

    return Promise.all(promises).then(() => {
      const valid = textures.filter(Boolean);
      _shuffle(valid);
      // Replace array contents with shuffled valid entries
      textures.length = 0;
      valid.forEach(t => textures.push(t));
      console.log(`Assets: ${textures.length}/${items.length} loaded`);
    });
  }

  function _loadItem(item) {
    if (typeof item === 'string') {
      return _loadImage(item);
    }
    if (item && item.type === 'video') {
      return _loadVideo(item.src);
    }
    if (item && item.type === 'vimeo') {
      return _loadVimeoThumb(item.id);
    }
    console.warn('Assets: unknown item type', item);
    return Promise.resolve(null);
  }

  /* ── Image ────────────────────────────────── */
  function _loadImage(path) {
    return new Promise(resolve => {
      const loader = new THREE.TextureLoader();
      loader.load(
        path,
        tex => {
          tex.minFilter     = THREE.LinearFilter;
          tex.magFilter     = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.wrapS         = THREE.RepeatWrapping;
          tex.wrapT         = THREE.RepeatWrapping;
          // Store natural aspect ratio directly — userData doesn't exist in r128
          tex._imageAspect = tex.image.width / tex.image.height;
          textures.push(tex);
          resolve(tex);
        },
        undefined,
        err => {
          console.warn(`Assets: failed to load image ${path}`, err);
          resolve(null);
        }
      );
    });
  }

  /* ── Self-hosted video ────────────────────── */
  function _loadVideo(src) {
    return new Promise(resolve => {
      const video = document.createElement('video');
      video.src         = src;
      video.crossOrigin = 'anonymous';
      video.loop        = true;
      video.muted       = true;      // required for autoplay
      video.playsInline = true;
      video.autoplay    = true;

      video.addEventListener('canplaythrough', () => {
        video.play().catch(() => {});  // best-effort
        const tex = new THREE.VideoTexture(video);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        textures.push(tex);
        resolve(tex);
      }, { once: true });

      video.addEventListener('error', err => {
        console.warn(`Assets: failed to load video ${src}`, err);
        resolve(null);
      }, { once: true });

      video.load();
    });
  }

  /* ── Vimeo thumbnail ─────────────────────────
     Vimeo intentionally blocks cross-origin canvas
     and WebGL access at the CDN level — this is a
     deliberate rights-protection decision, not a
     config issue. No iframe, SDK, or token changes it.

     What DOES work:
       → Static thumbnail via oEmbed API (below)
       → Self-hosted file: { type:'video', src:'...' }

     For motion inside shapes, host the file yourself.
     ─────────────────────────────────────────────*/
  function _loadVimeoThumb(videoId) {
    // Extract numeric ID if a full URL was passed
    const id = String(videoId).match(/(\d+)/)?.[1];
    if (!id) {
      console.warn(`Assets: could not parse Vimeo ID from "${videoId}"`);
      return Promise.resolve(null);
    }

    const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}&width=1280`;

    return fetch(oEmbedUrl)
      .then(r => r.json())
      .then(data => {
        const thumbUrl = data.thumbnail_url;
        if (!thumbUrl) throw new Error('no thumbnail_url in response');
        return _loadImage(thumbUrl);
      })
      .catch(err => {
        console.warn(`Assets: Vimeo thumbnail failed for ID ${id}`, err);
        return null;
      });
  }

  /* ── next() — round-robin ─────────────────── */
  function next() {
    if (textures.length === 0) return null;
    const tex = textures[cursor % textures.length];
    cursor++;
    return tex;
  }

  /* ── Fisher-Yates shuffle ─────────────────── */
  function _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /* ── Cover-fit a texture into a shape ────────
     Call with the texture and the shape's display
     aspect ratio (width/height in screen space).
     Sets repeat + offset so image fills the shape
     the same way CSS object-fit:cover does.       */
  function coverFit(tex, shapeAspect) {
    if (!tex || !tex._imageAspect) return;

    const imgAspect = tex._imageAspect;
    let repeatX, repeatY;

    if (imgAspect > shapeAspect) {
      repeatX = shapeAspect / imgAspect;
      repeatY = 1;
    } else {
      repeatX = 1;
      repeatY = imgAspect / shapeAspect;
    }

    tex.repeat.set(repeatX, repeatY);
    tex.offset.set((1 - repeatX) / 2, (1 - repeatY) / 2);
    tex.needsUpdate = true;
  }

  function count() { return textures.length; }

  return { load, next, coverFit, count };

})();