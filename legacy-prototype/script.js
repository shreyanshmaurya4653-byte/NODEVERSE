/* ============================================================
   NODEVERSE – script.js
   ============================================================ */

// ── 1. NAVBAR: add .scrolled class on scroll ─────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ── 2. HAMBURGER MENU ────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});
// Close menu on link click
navLinks?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  })
);

// ── 3. ANIMATED DAG CANVAS ───────────────────────────────────
(function initDagCanvas() {
  const canvas = document.getElementById('dag-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const NODE_COUNT = 18;
  const nodes = [];

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x:    randBetween(0.05, 0.95),
      y:    randBetween(0.05, 0.95),
      vx:   (Math.random() - 0.5) * 0.0004,
      vy:   (Math.random() - 0.5) * 0.0004,
      r:    randBetween(3, 7),
      hue:  Math.random() > 0.5 ? 270 : 192,   // purple or cyan
      alpha: randBetween(0.5, 1),
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Pre-compute edges (directed, no cycles – simple layered DAG)
  const edges = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const targets = [];
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (Math.random() < 0.22) targets.push(j);
    }
    targets.slice(0, 3).forEach(j => edges.push([i, j]));
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.005;

    const W = canvas.width, H = canvas.height;

    // Draw edges
    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b];
      const ax = na.x * W, ay = na.y * H;
      const bx = nb.x * W, by = nb.y * H;
      const dist = Math.hypot(bx - ax, by - ay);
      if (dist > W * 0.5) return;

      const grad = ctx.createLinearGradient(ax, ay, bx, by);
      grad.addColorStop(0, `hsla(${na.hue}, 80%, 70%, 0.18)`);
      grad.addColorStop(1, `hsla(${nb.hue}, 80%, 70%, 0.06)`);
      ctx.beginPath();
      ctx.moveTo(ax, ay);

      // Slight curve
      const mx = (ax + bx) / 2 + (by - ay) * 0.1;
      const my = (ay + by) / 2 - (bx - ax) * 0.1;
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Animated dot traveling along edge
      const progress = ((t * 0.4 + (a * 0.07 + b * 0.03)) % 1);
      const tp = progress;
      const dotX = (1 - tp) * (1 - tp) * ax + 2 * (1 - tp) * tp * mx + tp * tp * bx;
      const dotY = (1 - tp) * (1 - tp) * ay + 2 * (1 - tp) * tp * my + tp * tp * by;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${na.hue}, 90%, 75%, 0.9)`;
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach((n, i) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0.02 || n.x > 0.98) n.vx *= -1;
      if (n.y < 0.02 || n.y > 0.98) n.vy *= -1;

      const px = n.x * W, py = n.y * H;
      const pulse = n.r + Math.sin(t * 1.5 + n.phase) * 1.5;

      // Outer glow
      const grd = ctx.createRadialGradient(px, py, 0, px, py, pulse * 3);
      grd.addColorStop(0, `hsla(${n.hue}, 80%, 70%, 0.15)`);
      grd.addColorStop(1, `hsla(${n.hue}, 80%, 70%, 0)`);
      ctx.beginPath();
      ctx.arc(px, py, pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core node
      ctx.beginPath();
      ctx.arc(px, py, pulse, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${n.hue}, 80%, 65%, ${n.alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── 4. ANIMATED COUNTER FOR HERO STATS ───────────────────────
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const isDecimal = target % 1 !== 0;
  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = eased * target;
    el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('[data-target]').forEach(el => {
        animateCounter(el, parseFloat(el.dataset.target));
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ── 5. SCROLL REVEAL ─────────────────────────────────────────
(function initReveal() {
  const targets = [
    '.feature-card',
    '.process-card',
    '.arch-detail-card',
    '.node-card',
    '.tech-table tbody tr',
    '.arch-layer',
    '.cta-card',
    '.section-header',
  ];
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 0.07}s`;
    });
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
})();

// ── 6. COPY DOCKER COMMAND ────────────────────────────────────
const copyBtn = document.getElementById('copy-docker-cmd');
const codeCmd = document.getElementById('cta-code');
copyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeCmd.textContent);
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>`;
    setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 2000);
  } catch {
    // Fallback for browsers without clipboard API
    const range = document.createRange();
    range.selectNode(codeCmd);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
});

// ── 7. ACTIVE NAV LINK HIGHLIGHT ON SCROLL ───────────────────
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        activeLink?.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));
})();

// Add active nav link style
const styleTag = document.createElement('style');
styleTag.textContent = `.nav-link.active { color: var(--text-primary) !important; background: var(--purple-dim) !important; }`;
document.head.appendChild(styleTag);

// ── 8. SMOOTH PARALLAX ON HERO GLOWS ─────────────────────────
document.addEventListener('mousemove', e => {
  const mx = (e.clientX / window.innerWidth  - 0.5) * 30;
  const my = (e.clientY / window.innerHeight - 0.5) * 30;
  const g1 = document.querySelector('.glow-1');
  const g2 = document.querySelector('.glow-2');
  if (g1) g1.style.transform = `translate(${mx * 0.5}px, ${my * 0.5}px)`;
  if (g2) g2.style.transform = `translate(${-mx * 0.4}px, ${-my * 0.4}px)`;
});

// ── 9. ARCH BADGE HOVER RIPPLE ───────────────────────────────
document.querySelectorAll('.arch-badge').forEach(badge => {
  badge.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.05)';
  });
  badge.addEventListener('mouseleave', function() {
    this.style.transform = '';
  });
});
