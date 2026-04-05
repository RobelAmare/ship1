/* ===================================================
   ABOUT SECTION — Scroll-Driven Image Sequence
   288 frames · bidirectional · cover-scaled canvas
   =================================================== */

(function () {
  'use strict';

  /* ── Constants ──────────────────────────────────── */
  const FRAME_COUNT  = 288;
  const FRAME_FOLDER = 'ezgif-45dc254966de6823-jpg';
  const PAD          = 3; // zero-pad → "001"

  // Scroll distance = SCROLL_MULTIPLIER × 100vh
  // More frames → we want more travel time; 8× gives a cinematic pace
  const SCROLL_MULTIPLIER = 8;

  /* ── Text copy phases (5 phases across progress 0→1) ── */
  const PHASES = [
    {
      from: 0,
      to:   0.18,
      label:   'About Me',
      heading: 'Pioneering\u00A0<em>ideas</em>\u00A0for minds that\u00A0<em>create.</em>',
      body:    'I\u2019m a creative developer and designer with a passion for building digital experiences that feel alive. Every pixel, every interaction \u2014 intentional.',
    },
    {
      from: 0.18,
      to:   0.38,
      label:   'Background',
      heading: 'Rooted in\u00A0<em>craft,</em> driven\u00A0by\u00A0<em>vision.</em>',
      body:    'With a keen eye for detail and years of hands-on work across design and engineering, I bridge the gap between aesthetics and functionality.',
    },
    {
      from: 0.38,
      to:   0.58,
      label:   'Philosophy',
      heading: 'Where bold\u00A0<em>design</em> meets precision\u00A0<em>code.</em>',
      body:    'I believe the best interfaces are invisible \u2014 they guide users without effort. My work sits at the intersection of pure craft and thoughtful engineering.',
    },
    {
      from: 0.58,
      to:   0.80,
      label:   'Process',
      heading: 'Building things\u00A0that\u00A0<em>last</em> and\u00A0<em>inspire.</em>',
      body:    'From rapid prototypes to production-ready systems, I move fast without breaking trust. Clean architecture, performant code, beautiful outcomes.',
    },
    {
      from: 0.80,
      to:   1.00,
      label:   'Let\u2019s Create',
      heading: 'Ready to build\u00A0something\u00A0<em>extraordinary?</em>',
      body:    'I\u2019m always open to ambitious new projects and collaborations. If you have a vision worth pursuing, I want to help you make it real.',
    },
  ];

  /* ── State ──────────────────────────────────────── */
  let images       = [];   // HTMLImageElement[] in frame order
  let loadedFlags  = [];   // bool[] — true once decoded
  let canvas, ctx;
  let aboutSection;
  let currentFrameIdx = -1; // last rendered frame (−1 = nothing yet)
  let currentPhaseIdx = -1;
  let rafQueued       = false;
  let intrinsicW      = 0;  // natural image width (set on first load)
  let intrinsicH      = 0;

  /* ── Helpers ────────────────────────────────────── */
  const frameFilename = (i) =>
    `${FRAME_FOLDER}/ezgif-frame-${String(i + 1).padStart(PAD, '0')}.jpg`;

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  /* ── DOM Bootstrap ──────────────────────────────── */
  function init() {
    aboutSection = document.getElementById('about');
    canvas       = document.getElementById('about-canvas');
    if (!aboutSection || !canvas) return;

    ctx = canvas.getContext('2d');

    preloadFrames();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    scheduleUpdate(); // paint frame 0 immediately
  }

  /* ── Image Preloading ───────────────────────────── */
  function preloadFrames() {
    images      = new Array(FRAME_COUNT).fill(null);
    loadedFlags = new Array(FRAME_COUNT).fill(false);
    let loadedCount = 0;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img  = new Image();
      img.decoding = 'async';

      img.onload = makeOnLoad(i, img, () => {
        loadedCount++;
        updateLoadingBar(loadedCount);
        // Capture intrinsic size from first successful load
        if (intrinsicW === 0 && img.naturalWidth > 0) {
          intrinsicW    = img.naturalWidth;
          intrinsicH    = img.naturalHeight;
          canvas.width  = intrinsicW;
          canvas.height = intrinsicH;
        }
        if (i === currentFrameIdx || currentFrameIdx === -1) {
          scheduleUpdate();
        }
      });

      img.onerror = () => {
        loadedCount++;
        updateLoadingBar(loadedCount);
      };

      img.src   = frameFilename(i);
      images[i] = img;
    }
  }

  /** Factory to avoid closure-over-loop-variable issues */
  function makeOnLoad(idx, img, cb) {
    return () => {
      loadedFlags[idx] = true;
      cb();
    };
  }

  /* ── Loading Bar ──────────────────────────────── */
  function updateLoadingBar(loaded) {
    const bar  = document.getElementById('about-loading-bar');
    const wrap = document.getElementById('about-loading-wrap');
    if (!bar) return;

    bar.style.width = `${(loaded / FRAME_COUNT) * 100}%`;

    if (loaded >= FRAME_COUNT && wrap) {
      // Fade the bar out once everything is loaded
      wrap.style.opacity = '0';
      setTimeout(() => { wrap.style.display = 'none'; }, 700);
    }
  }

  /* ── Scroll Progress ────────────────────────────── */
  /**
   * Returns [0, 1] — how far the user has scrolled through the
   * about section's sticky region (height = SCROLL_MULTIPLIER × 100vh).
   *
   *   progress = 0  → section just entered viewport (top of sticky area)
   *   progress = 1  → sticky area fully exited upward
   */
  function getScrollProgress() {
    if (!aboutSection) return 0;
    const sectionH  = aboutSection.offsetHeight;        // px
    const viewportH = window.innerHeight;
    const scrolled  = -aboutSection.getBoundingClientRect().top; // px moved up
    const scrollable = sectionH - viewportH;
    if (scrollable <= 0) return 0;
    return clamp(scrolled / scrollable, 0, 1);
  }

  /* ── Frame Index from Progress ──────────────────── */
  function progressToFrame(p) {
    return clamp(Math.round(p * (FRAME_COUNT - 1)), 0, FRAME_COUNT - 1);
  }

  /* ── Phase Detection ────────────────────────────── */
  function getPhaseIndex(p) {
    for (let i = 0; i < PHASES.length; i++) {
      if (p >= PHASES[i].from && p < PHASES[i].to) return i;
    }
    return PHASES.length - 1;
  }

  /* ── Cover-Scaled Canvas Draw ───────────────────── */
  /**
   * Mimics CSS object-fit:cover — always fills the canvas element's
   * CSS dimensions, cropping the image symmetrically if needed.
   */
  function renderFrame(idx) {
    const img = loadedFlags[idx] ? images[idx] : findNearestLoaded(idx);
    if (!img) return;

    const iW = img.naturalWidth;
    const iH = img.naturalHeight;
    if (iW === 0 || iH === 0) return;

    const cW = canvas.width;
    const cH = canvas.height;

    // Compute cover scale
    const scale = Math.max(cW / iW, cH / iH);
    const dW    = iW * scale;
    const dH    = iH * scale;
    const dx    = (cW - dW) / 2;
    const dy    = (cH - dH) / 2;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(img, dx, dy, dW, dH);
  }

  /** Walk outward from idx both directions to find the nearest loaded frame */
  function findNearestLoaded(idx) {
    for (let d = 1; d < FRAME_COUNT; d++) {
      const lo = idx - d;
      const hi = idx + d;
      if (lo >= 0 && loadedFlags[lo]) return images[lo];
      if (hi < FRAME_COUNT && loadedFlags[hi]) return images[hi];
    }
    return null;
  }

  /* ── Dynamic Text ───────────────────────────────── */
  function updateText(phaseIdx) {
    if (phaseIdx === currentPhaseIdx) return;

    const phase   = PHASES[phaseIdx];
    const label   = document.getElementById('about-dyn-label');
    const heading = document.getElementById('about-dyn-heading');
    const body    = document.getElementById('about-dyn-body');
    const textBox = document.getElementById('about-text-box');
    if (!textBox) return;

    // Start fade-out
    textBox.classList.remove('about-text--visible');
    textBox.classList.add('about-text--hidden');

    setTimeout(() => {
      if (label)   label.textContent  = phase.label;
      if (heading) heading.innerHTML  = phase.heading;
      if (body)    body.textContent   = phase.body;

      textBox.classList.remove('about-text--hidden');
      textBox.classList.add('about-text--visible');
    }, 220); // half of 440ms CSS transition

    currentPhaseIdx = phaseIdx;
  }

  /* ── Canvas Resize Sync ─────────────────────────── */
  /**
   * Keep the canvas coordinate space matching the viewport so the
   * cover-scaling maths stays correct after window resize.
   */
  function syncCanvasSize() {
    const vW = window.innerWidth;
    const vH = window.innerHeight;
    if (canvas.width !== vW || canvas.height !== vH) {
      canvas.width  = vW;
      canvas.height = vH;
    }
  }

  /* ── Main Update ────────────────────────────────── */
  function update() {
    rafQueued = false;

    syncCanvasSize();

    const progress = getScrollProgress();
    const frameIdx = progressToFrame(progress);
    const phaseIdx = getPhaseIndex(progress);

    if (frameIdx !== currentFrameIdx) {
      renderFrame(frameIdx);
      currentFrameIdx = frameIdx;
    }

    updateText(phaseIdx);
  }

  function scheduleUpdate() {
    if (!rafQueued) {
      rafQueued = true;
      requestAnimationFrame(update);
    }
  }

  /* ── Kick-off ───────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
