/**
 * Kyaw Zay Ya Hein — Portfolio Experience Engine
 * Motion, Interactive A* Pathfinding Visualizer, and Dynamic Navigation
 */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. HERO ENTRANCE SEQUENCE
     ============================================================ */
  function initHeroEntrance() {
    // If reduced motion is requested, show immediately without delays
    if (prefersReduced) {
      document.body.classList.add('is-loaded');
      return;
    }

    // Allow layout pass to complete so the editorial entrance sequence is fully visible
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-loaded');
      });
    }, 40);
  }

  /* ============================================================
     2. NAVIGATION: SCROLL STATE & ACTIVE LINK TRACKING
     ============================================================ */
  function initNavigation() {
    const nav = document.querySelector('.nav');
    const sections = document.querySelectorAll('main > section[id], main > section.hero');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    if (!nav) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Toggle frosted glass scroll state
          if (scrollY > 30) {
            nav.classList.add('nav-scrolled');
          } else {
            nav.classList.remove('nav-scrolled');
          }

          // Active section highlight
          let currentSectionId = '';
          const scrollBuffer = 180; // pixels from top to consider section active

          sections.forEach((sec) => {
            const top = sec.offsetTop - scrollBuffer;
            const height = sec.offsetHeight;
            if (scrollY >= top && scrollY < top + height) {
              currentSectionId = sec.getAttribute('id') || 'top';
            }
          });

          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${currentSectionId}` || (currentSectionId === 'top' && href === '#top')) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check
  }

  /* ============================================================
     3. SCROLL REVEAL OBSERVER
     ============================================================ */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal, .reveal-head, .reveal-stagger');

    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            // Unobserve to prevent repeat jumps on subtle scroll movements
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     4. SIGNATURE EXPERIENCE: BAGANETIC A* ROUTE PLANNER ENGINE
     ============================================================ */
  const baganMapData = {
    nodes: {
      ananda: { id: 'ananda', name: 'Ananda Temple', x: 155, y: 70, built: '1105 AD', type: 'Temple' },
      thatbyinnyu: { id: 'thatbyinnyu', name: 'Thatbyinnyu', x: 80, y: 130, built: '1144 AD', type: 'Temple' },
      gawdawpalin: { id: 'gawdawpalin', name: 'Gawdawpalin', x: 30, y: 80, built: '1227 AD', type: 'Temple' },
      shwesandaw: { id: 'shwesandaw', name: 'Shwesandaw', x: 110, y: 205, built: '1057 AD', type: 'Pagoda' },
      dhammayangyi: { id: 'dhammayangyi', name: 'Dhammayangyi', x: 235, y: 170, built: '1170 AD', type: 'Temple' },
      sulamani: { id: 'sulamani', name: 'Sulamani Temple', x: 280, y: 100, built: '1183 AD', type: 'Temple' }
    },
    edges: [
      { from: 'gawdawpalin', to: 'thatbyinnyu', distance: 0.9 },
      { from: 'thatbyinnyu', to: 'ananda', distance: 0.8 },
      { from: 'ananda', to: 'sulamani', distance: 1.7 },
      { from: 'thatbyinnyu', to: 'shwesandaw', distance: 1.1 },
      { from: 'ananda', to: 'dhammayangyi', distance: 1.5 },
      { from: 'shwesandaw', to: 'dhammayangyi', distance: 1.4 },
      { from: 'dhammayangyi', to: 'sulamani', distance: 1.2 }
    ]
  };

  function euclideanDistance(nodeA, nodeB) {
    if (!nodeA || !nodeB) return 0;
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    // Map coordinate scale to approximate km heuristic
    // Calibrated scale (0.008 km/px): strictly admissible (h <= d*) and monotonic/consistent
    // across all pairs in the Bagan road graph (max px/km ratio is 120.06 -> threshold <= 0.008329)
    return Math.sqrt(dx * dx + dy * dy) * 0.008;
  }

  function runAStar(startId, goalId) {
    const nodes = baganMapData.nodes;
    const edges = baganMapData.edges;

    if (!nodes[startId] || !nodes[goalId]) {
      return null;
    }

    if (startId === goalId) {
      return {
        path: [startId],
        totalDistance: 0,
        visitedCount: 1,
        visitedOrder: [startId]
      };
    }

    // Build adjacency list
    const adj = {};
    Object.keys(nodes).forEach((id) => (adj[id] = []));
    edges.forEach((e) => {
      adj[e.from].push({ to: e.to, dist: e.distance });
      adj[e.to].push({ to: e.from, dist: e.distance });
    });

    const openSet = [startId];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    Object.keys(nodes).forEach((id) => {
      gScore[id] = Infinity;
      fScore[id] = Infinity;
    });

    gScore[startId] = 0;
    fScore[startId] = euclideanDistance(nodes[startId], nodes[goalId]);

    const visitedOrder = [];

    while (openSet.length > 0) {
      // Find node with lowest fScore in openSet
      openSet.sort((a, b) => fScore[a] - fScore[b]);
      const current = openSet.shift();
      visitedOrder.push(current);

      if (current === goalId) {
        // Reconstruct path
        const path = [current];
        let curr = current;
        while (cameFrom[curr]) {
          curr = cameFrom[curr];
          path.unshift(curr);
        }
        return {
          path,
          totalDistance: gScore[goalId],
          visitedCount: visitedOrder.length,
          visitedOrder
        };
      }

      for (const neighbor of adj[current]) {
        const tentativeG = gScore[current] + neighbor.dist;
        if (tentativeG < gScore[neighbor.to]) {
          cameFrom[neighbor.to] = current;
          gScore[neighbor.to] = tentativeG;
          fScore[neighbor.to] = tentativeG + euclideanDistance(nodes[neighbor.to], nodes[goalId]);

          if (!openSet.includes(neighbor.to)) {
            openSet.push(neighbor.to);
          }
        }
      }
    }

    return null; // No path
  }

  function initBaganeticVisualizer() {
    const visualizerEl = document.getElementById('baganetic-engine');
    if (!visualizerEl) return;

    const startSelect = document.getElementById('astar-start');
    const goalSelect = document.getElementById('astar-goal');
    const runBtn = document.getElementById('astar-run-btn');
    const pathTextEl = document.getElementById('astar-res-path');
    const distTextEl = document.getElementById('astar-res-dist');
    const visitedTextEl = document.getElementById('astar-res-visited');
    const svgMap = document.getElementById('bagan-svg-map');

    if (!startSelect || !goalSelect || !runBtn || !svgMap) return;

    let selectedStart = 'ananda';
    let selectedGoal = 'dhammayangyi';

    function updateViewModeTabs() {
      const modeTabs = document.querySelectorAll('.bagan-mode-tab');
      const previewView = document.getElementById('bagan-view-preview');
      const engineView = document.getElementById('bagan-view-engine');

      modeTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const mode = tab.dataset.mode;
          modeTabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');

          if (mode === 'engine') {
            if (previewView) previewView.style.display = 'none';
            if (engineView) engineView.style.display = 'block';
            calculateAndRenderRoute();
          } else {
            if (previewView) previewView.style.display = 'block';
            if (engineView) engineView.style.display = 'none';
          }
        });
      });
    }

    function calculateAndRenderRoute() {
      startSelect.value = selectedStart;
      goalSelect.value = selectedGoal;

      if (selectedStart === selectedGoal) {
        if (pathTextEl) pathTextEl.textContent = `${baganMapData.nodes[selectedStart].name} (Origin = Destination)`;
        if (distTextEl) distTextEl.textContent = '0.00 km';
        if (visitedTextEl) visitedTextEl.textContent = '1 / 6';
        clearRouteHighlights();
        highlightSingleNode(selectedStart);
        return;
      }

      const result = runAStar(selectedStart, selectedGoal);
      if (!result) return;

      // Update HUD metrics
      if (pathTextEl) {
        pathTextEl.textContent = result.path.map((id) => baganMapData.nodes[id].name).join(' → ');
      }
      if (distTextEl) {
        distTextEl.textContent = `${result.totalDistance.toFixed(2)} km`;
      }
      if (visitedTextEl) {
        visitedTextEl.textContent = `${result.visitedCount} / 6 pagodas`;
      }

      // Visual SVG highlight
      renderSvgRoute(result.path);
    }

    function clearRouteHighlights() {
      svgMap.querySelectorAll('.bagan-edge').forEach((el) => {
        el.classList.remove('active', 'animating');
      });
      svgMap.querySelectorAll('.bagan-node').forEach((el) => {
        el.classList.remove('in-path', 'is-start', 'is-goal');
      });
    }

    function highlightSingleNode(id) {
      clearRouteHighlights();
      const nodeEl = svgMap.querySelector(`[data-node-id="${id}"]`);
      if (nodeEl) nodeEl.classList.add('is-start');
    }

    function renderSvgRoute(path) {
      clearRouteHighlights();

      // Highlight nodes
      path.forEach((id, idx) => {
        const nodeEl = svgMap.querySelector(`[data-node-id="${id}"]`);
        if (nodeEl) {
          nodeEl.classList.add('in-path');
          if (idx === 0) nodeEl.classList.add('is-start');
          if (idx === path.length - 1) nodeEl.classList.add('is-goal');
        }
      });

      // Highlight edges connecting consecutive path nodes
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edgeEl =
          svgMap.querySelector(`.bagan-edge[data-edge="${u}-${v}"]`) ||
          svgMap.querySelector(`.bagan-edge[data-edge="${v}-${u}"]`);
        if (edgeEl) {
          edgeEl.classList.add('active');
        }
      }
    }

    // Node click handlers directly on SVG map
    svgMap.querySelectorAll('.bagan-node').forEach((node) => {
      node.addEventListener('click', (e) => {
        e.preventDefault();
        const clickedId = node.dataset.nodeId;
        if (!clickedId) return;

        // Toggle logic: first click changes destination, shift-click or alternate changes origin
        if (clickedId === selectedStart) return;

        selectedGoal = clickedId;
        goalSelect.value = selectedGoal;
        calculateAndRenderRoute();
      });
    });

    startSelect.addEventListener('change', () => {
      selectedStart = startSelect.value;
      calculateAndRenderRoute();
    });

    goalSelect.addEventListener('change', () => {
      selectedGoal = goalSelect.value;
      calculateAndRenderRoute();
    });

    runBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calculateAndRenderRoute();
    });

    updateViewModeTabs();
    calculateAndRenderRoute();
  }

  /* ============================================================
     5. THEME TOGGLE WITH SMOOTH ICON STATE & TRANSITION
     ============================================================ */
  function updateThemeColorMeta(theme) {
    const metaTheme = document.getElementById('theme-color-meta') || document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0B0920' : '#FAF8FF');
    }
  }

  function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = currentTheme === 'dark' || (!currentTheme && systemPrefersDark);
      const nextTheme = isDark ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      updateThemeColorMeta(nextTheme);

      try {
        localStorage.setItem('theme', nextTheme);
      } catch (e) {
        /* storage may be restricted in some webviews */
      }
    });

    // Synchronize if system preference changes and user hasn't set an explicit preference
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery && mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          try {
            if (!localStorage.getItem('theme')) {
              const newTheme = e.matches ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', newTheme);
              document.documentElement.style.colorScheme = newTheme;
              updateThemeColorMeta(newTheme);
            }
          } catch (err) {}
        });
      }
    } catch (e) {}
  }

  /* ============================================================
     6. CARD TILT & MAGNETIC HOVER MICRO-INTERACTIONS
     ============================================================ */
  function initMicroInteractions() {
    if (prefersReduced || window.innerWidth < 900) return;

    const interactiveCards = document.querySelectorAll('.case, .hero-card');

    interactiveCards.forEach((card) => {
      let isHovered = false;
      let rafId = null;

      card.addEventListener('mouseenter', () => {
        isHovered = true;
      });

      card.addEventListener('mousemove', (e) => {
        if (!isHovered) return;
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const deltaX = (x - centerX) / centerX;
          const deltaY = (y - centerY) / centerY;

          // Very restrained 3D tilt (max 1.5 degrees)
          card.style.transform = `perspective(1000px) rotateX(${-deltaY * 1.5}deg) rotateY(${deltaX * 1.5}deg) translateY(-2px)`;
        });
      });

      card.addEventListener('mouseleave', () => {
        isHovered = false;
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = '';
      });
    });
  }

  /* ============================================================
     7. MINIMAL DESKTOP-ONLY CUSTOM CURSOR SYSTEM
     ============================================================ */
  function initCustomCursor() {
    // Strictly disable on touch screens, small viewports, or reduced motion
    if (prefersReduced || window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900) {
      return;
    }

    const cursorContainer = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');

    if (!cursorContainer || !cursorDot || !cursorRing) return;

    // Enable CSS cursor hiding on canvas/links only once JS confirms custom cursor is active
    document.documentElement.classList.add('has-custom-cursor');

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isMoving = false;
    let isVisible = false;
    let rafId = null;

    function renderRing() {
      const dx = mouseX - ringX;
      const dy = mouseY - ringY;
      ringX += dx * 0.22;
      ringY += dy * 0.22;

      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      // Sleep loop if ring has smoothly converged on mouse position
      if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
        rafId = requestAnimationFrame(renderRing);
      } else {
        isMoving = false;
        rafId = null;
      }
    }

    function updateCursorState(target) {
      if (!target) return;

      // 1. Interactive Elements (expand to magnetic halo ring)
      const interactive = target.closest(
        'a, button, .btn, .tag, .bagan-mode-tab, .engine-select, .bagan-node, .hero-card-chip, .case-media, .theme-toggle'
      );
      if (interactive) {
        cursorContainer.classList.add('cursor-hover');
        cursorContainer.classList.remove('cursor-text');
        return;
      }

      // 2. Readable Text Content (dim outer ring so reading & selecting text is natural)
      const textElem = target.closest('p, h1, h2, h3, h4, li, .hero-sub, .case-desc, .metric-value, input, textarea');
      if (textElem) {
        cursorContainer.classList.add('cursor-text');
        cursorContainer.classList.remove('cursor-hover');
        return;
      }

      // 3. Default Neutral Canvas
      cursorContainer.classList.remove('cursor-hover', 'cursor-text');
    }

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Hardware sync: 0ms delay for center pointer dot
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      if (!isVisible) {
        cursorContainer.style.opacity = '1';
        ringX = mouseX;
        ringY = mouseY;
        cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        isVisible = true;
      }

      updateCursorState(e.target);

      if (!isMoving) {
        isMoving = true;
        rafId = requestAnimationFrame(renderRing);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      cursorContainer.style.opacity = '0';
      isVisible = false;
    });

    document.addEventListener('mouseenter', () => {
      cursorContainer.style.opacity = '1';
      isVisible = true;
    });

    document.addEventListener('mouseover', (e) => {
      updateCursorState(e.target);
    }, { passive: true });
  }

  /* ============================================================
     INITIALIZATION
     ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeroEntrance();
    initNavigation();
    initScrollReveal();
    initBaganeticVisualizer();
    initThemeToggle();
    initMicroInteractions();
    initCustomCursor();
  });
})();
