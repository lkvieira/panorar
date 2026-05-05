// ==============================
// PANORAR — main.js
// ==============================

// --- Footer: ano dinâmico ---
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- Navbar: escurece ao scroll ---
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }, { passive: true });
}

// --- Mobile nav toggle ---
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ==============================
// LIGHTBOX — zoom, drag, setas
// ==============================

(function initLightbox() {
  const galleryItems = [...document.querySelectorAll('.gallery-item[data-src]')];
  const lightbox     = document.getElementById('lightbox');
  const img          = document.getElementById('lightbox-img');
  const wrapper      = document.getElementById('lightbox-wrapper');
  const counter      = document.getElementById('lightbox-counter');
  const btnClose     = document.querySelector('.lightbox-close');
  const btnPrev      = document.querySelector('.lightbox-prev');
  const btnNext      = document.querySelector('.lightbox-next');

  if (!lightbox || !galleryItems.length) return;

  let currentIndex = 0;
  let zoom         = 1;
  let tx = 0, ty   = 0;   // translate acumulado (px)
  let dragging     = false;

  // ── abrir / fechar ─────────────────────────────────

  function open(index) {
    currentIndex = index;
    loadImage(index);
    lightbox.showModal();
  }

  function close() {
    lightbox.close();
    resetZoom();
    img.src = '';
  }

  // ── carregar imagem ────────────────────────────────

  function loadImage(index) {
    resetZoom();
    img.style.transition = 'none';
    img.style.opacity    = '0';
    img.src = galleryItems[index].dataset.src;
    img.onload = () => {
      img.style.transition = 'opacity 0.2s';
      img.style.opacity    = '1';
    };
    if (counter) counter.textContent = `${index + 1} / ${galleryItems.length}`;
  }

  // ── navegar ─────────────────────────────────────────

  function navigate(dir) {
    currentIndex = (currentIndex + dir + galleryItems.length) % galleryItems.length;
    loadImage(currentIndex);
  }

  // ── zoom ────────────────────────────────────────────

  function resetZoom() {
    zoom = 1; tx = 0; ty = 0;
    if (img) { img.style.transition = 'none'; img.style.transform = ''; }
    wrapper?.classList.remove('zoomed', 'dragging');
  }

  function applyTransform(animated) {
    img.style.transition = animated ? 'transform 0.22s ease' : 'none';
    img.style.transform  = `scale(${zoom}) translate(${tx / zoom}px, ${ty / zoom}px)`;
    wrapper.classList.toggle('zoomed', zoom > 1);
  }

  function clamp() {
    const maxX = (wrapper.clientWidth  * (zoom - 1)) / 2;
    const maxY = (wrapper.clientHeight * (zoom - 1)) / 2;
    tx = Math.max(-maxX, Math.min(maxX, tx));
    ty = Math.max(-maxY, Math.min(maxY, ty));
  }

  function setZoom(level, animated = true) {
    zoom = Math.max(1, Math.min(5, level));
    if (zoom <= 1) { resetZoom(); return; }
    clamp();
    applyTransform(animated);
  }

  // ── eventos: abrir galeria ─────────────────────────

  galleryItems.forEach((item, i) => item.addEventListener('click', () => open(i)));

  // ── eventos: fechar ────────────────────────────────

  btnClose?.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  lightbox.addEventListener('close', () => { resetZoom(); img.src = ''; });

  // ── eventos: setas ─────────────────────────────────

  btnPrev?.addEventListener('click', e => { e.stopPropagation(); navigate(-1); });
  btnNext?.addEventListener('click', e => { e.stopPropagation(); navigate(1); });

  // ── eventos: teclado ───────────────────────────────

  document.addEventListener('keydown', e => {
    if (!lightbox.open) return;
    if (e.key === 'ArrowLeft')        navigate(-1);
    else if (e.key === 'ArrowRight')  navigate(1);
    else if (e.key === '+' || e.key === '=') setZoom(zoom + 0.5);
    else if (e.key === '-')           setZoom(zoom - 0.5);
  });

  // ── eventos: clique para zoom ─────────────────────

  wrapper?.addEventListener('click', e => {
    if (dragging) return;
    setZoom(zoom <= 1 ? 2.5 : 1);
  });

  // ── eventos: scroll para zoom ─────────────────────

  wrapper?.addEventListener('wheel', e => {
    e.preventDefault();
    setZoom(zoom + (e.deltaY < 0 ? 0.12 : -0.12), false);
  }, { passive: false });

  // ── eventos: arrastar para mover (mouse) ──────────

  wrapper?.addEventListener('mousedown', e => {
    if (zoom <= 1) return;
    e.preventDefault();
    dragging = false;

    const x0 = e.clientX, y0 = e.clientY;
    const tx0 = tx, ty0 = ty;

    wrapper.classList.add('dragging');

    const onMove = ev => {
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragging = true;
      tx = tx0 + dx;
      ty = ty0 + dy;
      clamp();
      applyTransform(false);
    };

    const onUp = () => {
      wrapper.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      setTimeout(() => { dragging = false; }, 50);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  // ── eventos: swipe (toque) ─────────────────────────

  let touchX0 = 0;
  lightbox.addEventListener('touchstart', e => {
    touchX0 = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchX0;
    if (Math.abs(dx) > 50) navigate(dx > 0 ? -1 : 1);
  }, { passive: true });
})();

// ==============================
// 360° PANNELLUM VIEWER
// ==============================

(function init360() {
  const el = document.getElementById('panorama-360');
  if (!el || typeof pannellum === 'undefined') return;

  const btnZoomIn     = document.getElementById('btn-360-zoomin');
  const btnZoomOut    = document.getElementById('btn-360-zoomout');
  const btnRotate     = document.getElementById('btn-360-rotate');
  const btnFullscreen = document.getElementById('btn-360-fullscreen');

  let viewer     = null;
  let isRotating = true;
  let started    = false;

  function start() {
    if (started) return;
    started = true;

    viewer = pannellum.viewer('panorama-360', {
      type:         'equirectangular',
      panorama:     'Visualizador%20360/360_Terreno_Palmeiras.jpg',
      autoLoad:     true,
      showControls: false,
      compass:      false,
      hfov:         100,
      pitch:        0,
      yaw:          0,
      mouseZoom:    false,  // evita zoom acidental ao rolar a página
      keyboardZoom: false,
      autoRotate:   -2.5,   // rotação ativa por padrão
    });

    // marca o botão de rotação como ativo após carregamento
    viewer.on('load', () => btnRotate?.classList.add('active'));

    btnZoomIn?.addEventListener('click', () =>
      viewer.setHfov(Math.max(30, viewer.getHfov() - 15)));
    btnZoomOut?.addEventListener('click', () =>
      viewer.setHfov(Math.min(120, viewer.getHfov() + 15)));
    btnRotate?.addEventListener('click', () => {
      isRotating = !isRotating;
      isRotating ? viewer.startAutoRotate(-2.5) : viewer.stopAutoRotate();
      btnRotate.classList.toggle('active', isRotating);
    });
    btnFullscreen?.addEventListener('click', () => viewer.toggleFullscreen());
  }

  // Em mobile (< 768px) o Pannellum não é inicializado:
  // a imagem de 84 MB causa crash de memória WebGL em dispositivos móveis.
  if (window.innerWidth < 768) return;

  // No desktop, inicializa apenas quando a seção entrar no viewport.
  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        start();
        observer.disconnect();
      }
    },
    { rootMargin: '300px', threshold: 0 }
  );
  observer.observe(el);
})();
