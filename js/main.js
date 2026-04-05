/* ===================================================
   PORTFOLIO — Main JavaScript
   Scroll reveal, navbar, particles, interactions
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initHeroVideo();
  initScrollReveal();
  initNavbar();
  initParticles();
  initContactForm();
  initStatCounters();
  initScrollSequence();
});

/* ----- Scroll Reveal via IntersectionObserver ----- */
function initScrollReveal() {
  const REVEAL_SELECTORS = '.reveal, .reveal-left, .reveal-right';
  const elements = document.querySelectorAll(REVEAL_SELECTORS);

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '-50px' }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ----- Navbar ----- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.getElementById('navbar-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-close');
  const mobileLinks = document.querySelectorAll('.navbar__mobile-link');

  if (!navbar) return;

  // Navbar scroll behaviour — driven by Lenis if available, else native
  const heroSection = document.getElementById('hero');

  let lastScrollY   = window.scrollY;
  let heroHeight    = heroSection ? heroSection.offsetHeight : window.innerHeight;
  let navbarTicking = false;

  // Keep heroHeight fresh after resize
  window.addEventListener('resize', () => {
    heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
  }, { passive: true });

  function handleScroll(currentY) {
    if (navbarTicking) return;
    navbarTicking = true;
    requestAnimationFrame(() => {
      const pastHero      = currentY > heroHeight * 0.85;
      const scrollingDown = currentY > lastScrollY;

      if (pastHero && scrollingDown) {
        navbar.classList.add('navbar--hidden');
      } else {
        navbar.classList.remove('navbar--hidden');
      }

      const inner = navbar.querySelector('.navbar__inner');
      if (inner) {
        inner.classList.toggle('navbar__inner--scrolled', currentY > 40);
      }

      lastScrollY   = currentY;
      navbarTicking = false;
    });
  }

  // Prefer Lenis scroll event (fires after RAF, perfectly in-sync)
  if (window.__lenis) {
    window.__lenis.on('scroll', ({ scroll }) => handleScroll(scroll));
  } else {
    // Fallback for when Lenis CDN is unavailable
    window.addEventListener('scroll', () => handleScroll(window.scrollY), { passive: true });
  }

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileMenu) {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

/* ----- Floating Particles ----- */
function initParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const PARTICLE_COUNT = 30;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${6 + Math.random() * 10}s`;
    particle.style.animationDelay = `${Math.random() * 8}s`;
    particle.style.width = `${1 + Math.random() * 2}px`;
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

/* ----- Lenis Smooth Scroll ----- */
function initLenis() {
  // Gracefully degrade if Lenis failed to load from CDN
  if (typeof Lenis === 'undefined') {
    console.warn('Lenis not loaded — falling back to native scroll.');
    return;
  }

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
  });

  // Expose globally so initNavbar can use it
  window.__lenis = lenis;

  // Hook Lenis into IntersectionObserver / ScrollTimeline via RAF
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Delegate all anchor hash links to Lenis for smooth jumps
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    });
  });
}

/* ----- Contact Form Submit Handler ----- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.contact__submit');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sent!';
    submitBtn.style.background = 'var(--color-accent)';
    submitBtn.style.color = '#fff';

    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
      submitBtn.style.color = '';
      form.reset();
    }, 2000);
  });
}

/* ----- Animated Stat Counters ----- */
function initStatCounters() {
  const stats = document.querySelectorAll('[data-count]');
  if (!stats.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((stat) => observer.observe(stat));
}

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out curve
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);

    el.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/* ----- Hero Background Video Crossfade Loop ----- */
function initHeroVideo() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  const FADE_DURATION_MS = 800;
  const FADE_OUT_BEFORE_END_S = 0.8;

  /**
   * Animate the video opacity from `from` to `to` over `duration` ms
   * using requestAnimationFrame for smooth performance.
   */
  function fadeVideo(from, to, duration) {
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-in-out for cinematic feel
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      video.style.opacity = from + (to - from) * eased;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // Fade in once the video has enough data to play
  video.addEventListener('canplay', function onCanPlay() {
    video.play().catch(() => {});
    fadeVideo(0, 1, FADE_DURATION_MS);
    video.removeEventListener('canplay', onCanPlay);
  });

  // Fade out near the end for a smooth loop crossfade
  let fadingOut = false;
  video.addEventListener('timeupdate', () => {
    if (video.duration && !fadingOut) {
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_BEFORE_END_S) {
        fadingOut = true;
        fadeVideo(parseFloat(video.style.opacity) || 1, 0, remaining * 1000);
      }
    }
  });

  // On ended, reset and fade back in for seamless loop
  video.addEventListener('ended', () => {
    video.style.opacity = '0';
    setTimeout(() => {
      video.currentTime = 0;
      video.play().catch(() => {});
      fadeVideo(0, 1, FADE_DURATION_MS);
      fadingOut = false;
    }, 100);
  });
}

/* ----- Scroll Sequence Animation ----- */
function initScrollSequence() {
  const container = document.getElementById('sequence-container');
  const canvas = document.getElementById('sequence-canvas');
  if (!container || !canvas) return;

  const ctx = canvas.getContext('2d');
  
  const frameCount = 100;
  const images = [];
  let imagesLoaded = 0;
  let currentFrameIndex = 0;
  
  const currentFrame = index => (index + 1).toString().padStart(3, '0');
  
  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = `converted_web_jpegs/${currentFrame(i)}.jpg`;
    img.onload = () => {
      imagesLoaded++;
      // Render the very first image immediately once it loads so the screen isn't blank
      if (i === 0) {
        renderImg(images[0]);
      } else if (i === currentFrameIndex) {
        // If we scrolled to a frame that just finished loading, render it
        renderImg(images[i]);
      }
    };
    images[i] = img; // Array keeps them in order
  }
  
  function renderImg(img) {
    if (!img) return;
    
    // If intrinsic dimensions changed, update the canvas coordinate system size.
    // CSS `object-fit: cover` will handle scaling it beautifully to the screen.
    if (canvas.width !== img.width && img.width > 0) {
      canvas.width = img.width;
      canvas.height = img.height;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (img.width > 0) {
      ctx.drawImage(img, 0, 0);
    }
  }

  let ticking = false;

  function updateSequence() {
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Progress starts when top of container hits bottom of viewport
    // Progress ends when bottom of container hits bottom of viewport 
    // Example: total scroll distance inside the container is rect.height
    let scrollDistance = rect.height;
    
    // Dist from top of container to the viewport bottom
    let progress = (windowHeight - rect.top) / scrollDistance;
    
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    
    currentFrameIndex = Math.min(
      frameCount - 1,
      Math.floor(progress * frameCount)
    );
    
    // Draw only if loaded
    if (images[currentFrameIndex] && images[currentFrameIndex].complete) {
      renderImg(images[currentFrameIndex]);
    }
    
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateSequence);
      ticking = true;
    }
  });
  
  // Initial trigger to paint the correct frame on load
  requestAnimationFrame(updateSequence);
}
