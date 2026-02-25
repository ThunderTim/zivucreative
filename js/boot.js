/* ─────────────────────────────────────────────
   ZIVU CREATIVE — boot.js
   Startup sequence and media manifest.

   Three media types:
     'path/to/image.jpg'                  image
     { type: 'video', src: 'path.mp4' }   self-hosted video (live in shape)
     { type: 'vimeo', id: '351686539' }   Vimeo thumbnail
       Note: Vimeo blocks live WebGL access due to CORS.
       Thumbnail is fetched via their oEmbed API.
       For motion video in a shape, host the file
       yourself and use type:'video'.
   ───────────────────────────────────────────── */

const PROJECT_IMAGES = [
  'assets/images/projects/01.jpg',
  'assets/images/projects/02.jpg',
  'assets/images/projects/03.jpg',
  'assets/images/projects/04.jpg',
  'assets/images/projects/05.jpg',
  'assets/images/projects/06.png',
  'assets/images/projects/07.png',
  'assets/images/projects/08.png',
  'assets/images/projects/09.jpg',
  'assets/images/projects/10.png',
  //{ type: 'vimeo', id: '351686539' },
  // { type: 'video', src: 'assets/video/reel.mp4' },
];

Scene.init();
Input.init();

// Wait for fonts AND assets before starting —
// fonts must be ready before Text.init() draws to canvas
Promise.all([
  document.fonts.ready,
  Assets.load(PROJECT_IMAGES),
]).then(() => {
  Text.init();
  ParticleSystem.init();
  Scene.start(dt => {
    ParticleSystem.update(dt);
    Text.update(dt);
  });
  ParticleSystem.wake();
});