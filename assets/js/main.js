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

  // Inicializa apenas quando a seção entrar no viewport.
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


// ==============================
// MAPAS — WEBODM (Leaflet)
// ==============================

(function initMaps() {
  const single = document.getElementById('map-canvas-single');
  if (!single || typeof L === 'undefined') return;

  // ============================================================
  // CONFIGURAÇÃO — edite os valores abaixo conforme seu projeto
  // ============================================================

  // Bounds do voo — extrair do KMZ do WebODM (LatLonBox: north/south/east/west).
  // Formato Leaflet: [[south, west], [north, east]]
  const PLACEHOLDER_BOUNDS = [[-19.888730, -44.065849], [-19.888000, -44.065195]];

  // Elevação do terreno em metros acima do nível do mar (extraídos do MDS no WebODM).
  // Deixe null para mostrar apenas "Min" e "Max" sem valores numéricos.
  const MDS_MIN_M = 898; // ex: 850
  const MDS_MAX_M = 905; // ex: 920

  // DEBUG: mostra um retângulo amarelo nas bordas do bounds (útil para validar
  // posicionamento contra o mapa de ruas). Mude para false em produção.
  const DEBUG_BOUNDS = false;

  // ============================================================

  // Paleta jet (espectro completo: azul → ciano → verde → amarelo → laranja → vermelho)
  const MDS_GRADIENT = 'linear-gradient(to right, #00007f, #0000ff, #007fff, #00ffff, #7fff7f, #ffff00, #ff7f00, #ff0000, #7f0000)';

  const LAYERS = {
    orto: {
      url: 'Mapas/orto.jpg',
      label: 'Ortomosaico',
      bounds: PLACEHOLDER_BOUNDS,
      legend: null,
    },
    fito: {
      url: 'Mapas/fitossanidade.jpg',
      label: 'Fitossanidade (VARI)',
      bounds: PLACEHOLDER_BOUNDS,
      legend: {
        title: 'VARI',
        gradient: 'linear-gradient(to right, #b30000, #f0c000, #2d8a2d)',
        labels: ['Estresse', 'Neutro', 'Vegetação saudável'],
      },
    },
    mds: {
      url: 'Mapas/mds.jpg',
      label: 'Modelo de Superfície',
      bounds: PLACEHOLDER_BOUNDS,
      legend: {
        title: 'Elevação',
        gradient: MDS_GRADIENT,
        labels: [
          MDS_MIN_M != null ? `${MDS_MIN_M} m` : 'Min',
          '',
          MDS_MAX_M != null ? `${MDS_MAX_M} m` : 'Max',
        ],
        note: 'Metros acima do nível do mar',
        disclaimer: 'Valores estimados',
      },
    },
  };

  // ============================================================
  // BASEMAPS — mapa de fundo (atualmente apenas satélite ativo)
  // ============================================================
  const BASEMAPS = {
    satelite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics, GIS Community',
      maxNativeZoom: 19, // limite real do Esri (acima disso, reescala em vez de mostrar cinza)
    },
  };

  // Layer de rótulos (ruas, cidades, bairros) — estilo "satélite híbrido"
  const LABEL_LAYERS = [
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
  ];

  const MAX_ZOOM = 23; // zoom máximo permitido (tiles reescalam acima do nativo)

  let mapSingle = null, mapLeft = null, mapRight = null;
  let overlaySingle = null, overlayLeft = null, overlayRight = null;
  let baseSingle = null, baseLeft = null, baseRight = null;
  let labelsSingle = null, labelsLeft = null, labelsRight = null;
  let currentKey = 'orto', leftKey = 'orto', rightKey = 'mds';
  let currentBase = 'satelite';
  let labelsVisible = true;
  let compareMode = false, syncing = false, started = false;
  let currentRatio = 0.5;

  function makeBaseLayer(key) {
    const cfg = BASEMAPS[key];
    return L.tileLayer(cfg.url, {
      maxZoom: MAX_ZOOM,
      maxNativeZoom: cfg.maxNativeZoom,
      attribution: cfg.attribution,
    });
  }

  function makeLabelsLayer(map) {
    const layers = LABEL_LAYERS.map(url => L.tileLayer(url, {
      maxZoom: MAX_ZOOM,
      maxNativeZoom: 19,
      pane: 'labels',
    }));
    return L.layerGroup(layers);
  }

  function ensureLabelsPane(map) {
    if (map.getPane('labels')) return;
    const pane = map.createPane('labels');
    pane.style.zIndex = 450; // acima de overlayPane (400), abaixo de markerPane (600)
    pane.style.pointerEvents = 'none';
  }

  function createMap(el) {
    const m = L.map(el, {
      zoomControl: true,
      attributionControl: true,
      maxZoom: MAX_ZOOM,
    });
    ensureLabelsPane(m);
    return m;
  }

  function setBasemap(key) {
    if (!BASEMAPS[key]) return;
    currentBase = key;
    if (mapSingle && baseSingle) {
      mapSingle.removeLayer(baseSingle);
      baseSingle = makeBaseLayer(key).addTo(mapSingle);
      if (overlaySingle) overlaySingle.bringToFront();
    }
    if (mapLeft && baseLeft) {
      mapLeft.removeLayer(baseLeft);
      baseLeft = makeBaseLayer(key).addTo(mapLeft);
      if (overlayLeft) overlayLeft.bringToFront();
    }
    if (mapRight && baseRight) {
      mapRight.removeLayer(baseRight);
      baseRight = makeBaseLayer(key).addTo(mapRight);
      if (overlayRight) overlayRight.bringToFront();
    }
  }

  function setLabelsVisible(visible) {
    labelsVisible = visible;
    const apply = (map, ref, setter) => {
      if (!map) return;
      if (visible && !ref()) setter(makeLabelsLayer().addTo(map));
      else if (!visible && ref()) { map.removeLayer(ref()); setter(null); }
    };
    apply(mapSingle, () => labelsSingle, v => labelsSingle = v);
    apply(mapLeft,   () => labelsLeft,   v => labelsLeft   = v);
    apply(mapRight,  () => labelsRight,  v => labelsRight  = v);
  }

  function showSingle(key) {
    if (overlaySingle) mapSingle.removeLayer(overlaySingle);
    overlaySingle = L.imageOverlay(LAYERS[key].url, LAYERS[key].bounds).addTo(mapSingle);
    updateLegend(key);
  }

  function addDebugRect(map, bounds) {
    if (!DEBUG_BOUNDS) return;
    L.rectangle(bounds, { color: '#ffeb3b', weight: 2, fill: false, dashArray: '6,4' }).addTo(map);
  }

  function refreshCompareOverlays() {
    if (overlayLeft)  mapLeft.removeLayer(overlayLeft);
    if (overlayRight) mapRight.removeLayer(overlayRight);
    overlayLeft  = L.imageOverlay(LAYERS[leftKey].url,  LAYERS[leftKey].bounds).addTo(mapLeft);
    overlayRight = L.imageOverlay(LAYERS[rightKey].url, LAYERS[rightKey].bounds).addTo(mapRight);
  }

  function applyCompareClip(ratio) {
    currentRatio = ratio;
    const pct = (ratio * 100).toFixed(2);
    document.getElementById('map-canvas-left').style.clipPath  = `inset(0 ${(100 - pct).toFixed(2)}% 0 0)`;
    document.getElementById('map-canvas-right').style.clipPath = `inset(0 0 0 ${pct}%)`;
    document.getElementById('map-compare-slider').style.left = `${pct}%`;
  }

  function setupSliderDrag() {
    const slider = document.getElementById('map-compare-slider');
    const cont   = document.getElementById('map-compare-container');
    let dragging = false;

    const moveTo = clientX => {
      const rect = cont.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      applyCompareClip(ratio);
    };

    slider.addEventListener('pointerdown', e => {
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    slider.addEventListener('pointermove', e => { if (dragging) moveTo(e.clientX); });
    slider.addEventListener('pointerup',   e => { dragging = false; slider.releasePointerCapture(e.pointerId); });
    slider.addEventListener('pointercancel', () => { dragging = false; });

    applyCompareClip(0.5);
  }

  function enterCompare() {
    document.getElementById('map-canvas-single').hidden = true;
    document.getElementById('map-compare-container').hidden = false;

    if (!mapLeft) {
      mapLeft  = createMap(document.getElementById('map-canvas-left'));
      mapRight = createMap(document.getElementById('map-canvas-right'));
      baseLeft  = makeBaseLayer(currentBase).addTo(mapLeft);
      baseRight = makeBaseLayer(currentBase).addTo(mapRight);
      if (labelsVisible) {
        labelsLeft  = makeLabelsLayer().addTo(mapLeft);
        labelsRight = makeLabelsLayer().addTo(mapRight);
      }
      mapLeft.on('move zoom',  () => {
        if (syncing) return;
        syncing = true;
        mapRight.setView(mapLeft.getCenter(), mapLeft.getZoom(), { animate: false });
        syncing = false;
      });
      mapRight.on('move zoom', () => {
        if (syncing) return;
        syncing = true;
        mapLeft.setView(mapRight.getCenter(), mapRight.getZoom(), { animate: false });
        syncing = false;
      });
      setupSliderDrag();
    }

    mapLeft.fitBounds(LAYERS[leftKey].bounds);
    refreshCompareOverlays();
    updateLegend(null);

    setTimeout(() => {
      mapLeft.invalidateSize();
      mapRight.invalidateSize();
      applyCompareClip(currentRatio);
    }, 50);
  }

  function exitCompare() {
    document.getElementById('map-compare-container').hidden = true;
    document.getElementById('map-canvas-single').hidden = false;
    setTimeout(() => mapSingle.invalidateSize(), 50);
    showSingle(currentKey);
  }

  function updateLegend(key) {
    const el = document.getElementById('map-legend');
    if (!el) return;
    const lg = key && LAYERS[key] ? LAYERS[key].legend : null;
    if (!lg) { el.hidden = true; return; }
    document.getElementById('map-legend-title').textContent = lg.title;
    document.getElementById('map-legend-bar').style.background = lg.gradient;
    document.getElementById('map-legend-labels').innerHTML = lg.labels.map(l => `<span>${l}</span>`).join('');

    const noteEl = document.getElementById('map-legend-note');
    const discEl = document.getElementById('map-legend-disclaimer');
    if (lg.note) { noteEl.textContent = lg.note; noteEl.hidden = false; }
    else { noteEl.hidden = true; }
    if (lg.disclaimer) { discEl.textContent = lg.disclaimer; discEl.hidden = false; }
    else { discEl.hidden = true; }

    el.hidden = false;
  }

  function wireControls() {
    document.querySelectorAll('input[name="map-layer"]').forEach(r => {
      r.addEventListener('change', e => {
        if (compareMode) return;
        currentKey = e.target.value;
        showSingle(currentKey);
      });
    });

    const tBtn = document.getElementById('map-compare-toggle');
    tBtn.addEventListener('click', () => {
      compareMode = !compareMode;
      tBtn.setAttribute('aria-pressed', String(compareMode));
      tBtn.textContent = compareMode ? 'Voltar' : 'Comparar';
      document.getElementById('map-compare-pair').hidden = !compareMode;
      document.querySelectorAll('input[name="map-layer"]').forEach(r => r.disabled = compareMode);
      if (compareMode) enterCompare(); else exitCompare();
    });

    document.getElementById('map-left-select').addEventListener('change', e => {
      leftKey = e.target.value;
      if (compareMode) refreshCompareOverlays();
    });
    document.getElementById('map-right-select').addEventListener('change', e => {
      rightKey = e.target.value;
      if (compareMode) refreshCompareOverlays();
    });

    const labelsToggle = document.getElementById('map-labels-toggle');
    labelsToggle?.addEventListener('change', e => setLabelsVisible(e.target.checked));

    const wrapper = document.querySelector('.map-viewer-wrapper');
    const fsBtn   = document.getElementById('btn-mapa-fullscreen');
    fsBtn?.addEventListener('click', () => {
      const isFs = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFs) {
        (wrapper.requestFullscreen || wrapper.webkitRequestFullscreen)?.call(wrapper);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      }
    });
    const onFsChange = () => {
      setTimeout(() => {
        mapSingle?.invalidateSize();
        mapLeft?.invalidateSize();
        mapRight?.invalidateSize();
        if (compareMode) applyCompareClip(currentRatio);
      }, 100);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    ['map-selector-box', 'map-legend', 'map-compare-slider'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
      }
    });
  }

  function start() {
    if (started) return;
    started = true;

    mapSingle = createMap(single);
    baseSingle = makeBaseLayer(currentBase).addTo(mapSingle);
    if (labelsVisible) labelsSingle = makeLabelsLayer().addTo(mapSingle);
    mapSingle.fitBounds(LAYERS.orto.bounds);
    showSingle(currentKey);
    addDebugRect(mapSingle, LAYERS.orto.bounds);
    wireControls();

    setTimeout(() => mapSingle.invalidateSize(), 200);
    window.addEventListener('resize', () => {
      mapSingle?.invalidateSize();
      mapLeft?.invalidateSize();
      mapRight?.invalidateSize();
      if (compareMode) applyCompareClip(currentRatio);
    });
  }

  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        start();
        observer.disconnect();
      }
    },
    { rootMargin: '300px', threshold: 0 }
  );
  observer.observe(single);
})();
