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
   'assets/images/projects/11.jpg',
  'assets/images/projects/12.jpg',
  'assets/images/projects/13.jpg',
   'assets/images/projects/14.jpg',
  'assets/images/projects/15.jpg',
  'assets/images/projects/16.jpg',
  'assets/images/projects/17.jpg',
  'assets/images/projects/18.jpg',
  'assets/images/projects/19.jpg',
   'assets/images/projects/20.jpg',
  'assets/images/projects/21.jpg',
  'assets/images/projects/22.jpg',

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