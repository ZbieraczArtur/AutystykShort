// canvas-compass.js – interaktywny kompas na canvas z zoomem i przesuwaniem (kwadratowy, stałe kolory, logo)

class CanvasCompass {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.mode = options.mode || 'weighted';
    this.creativeConfig = options.creativeConfig || {
      activePairs: [],
      labels: { top: 'Heteronomia', bottom: 'Autonomia', left: 'Socjalizm', right: 'Kapitalizm' }
    };
    this.onModeChange = options.onModeChange || (() => {});
    this.onCreativeConfigChange = options.onCreativeConfigChange || (() => {});

    // Stan widoku (zoom i przesunięcie)
    this.viewport = {
      offsetX: 0,      // przesunięcie w osi X (w jednostkach danych)
      offsetY: 0,      // przesunięcie w osi Y (w jednostkach danych)
      scale: 1,        // skala (1 = widoczny cały zakres -10..10)
    };
    this.dataRange = 20; // stały zakres danych (od -10 do 10)

    // Dane użytkownika
    this.userX = 0;
    this.userY = 0;
    this.activePairs = 0;
    this.modeLabel = this.getModeLabel();

    // Nakładki (partie, ideologie, użytkownicy)
    this.overlays = [];
    this.imageCache = {}; // cache dla załadowanych obrazów

    // Stan przeciągania
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartOffsetX = 0;
    this.dragStartOffsetY = 0;

    // Wymiary i offset canvas (kwadratowy obszar)
    this.baseSize = 0;
    this.offsetXCanvas = 0;
    this.offsetYCanvas = 0;

    this.ready = false;
    this.init();
  }

  getModeLabel() {
    const labels = {
      weighted: 'Wagowy',
      equal: 'Jednakowe wagi',
      institutional: 'Instytucjonalny',
      creative: 'Kreatywny'
    };
    return labels[this.mode] || 'Wagowy';
  }

  init() {
    this.container.innerHTML = '';

    // Wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = 'width: 100%; height: 100%; position: relative; overflow: hidden; touch-action: none;';
    this.container.appendChild(this.wrapper);

    // Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display: block; width: 100%; height: 100%; background: transparent; cursor: grab;';
    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Zdarzenia
    this.setupEvents();

    // Obserwator rozmiaru
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.wrapper);

    // Etykiety osi (subtelna skala)
    this.createAxisLabels();

    requestAnimationFrame(() => {
      this.resize();
      this.render();
      this.ready = true;
    });

    this.updateLabels();
  }

  createAxisLabels() {
    // Usuń stare
    this.wrapper.querySelectorAll('.axis-label-overlay, .axis-label-overlay-y, .axis-label-y-top, .axis-label-y-bottom')
      .forEach(el => el.remove());

    // Etykiety X (dół)
    const xContainer = document.createElement('div');
    xContainer.className = 'axis-label-overlay';
    xContainer.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      pointer-events: none;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      padding: 0 8px 4px 8px;
      font-size: 10px;
      color: var(--text-secondary, #475569);
      font-weight: 600;
      opacity: 0.7;
      font-family: monospace;
      user-select: none;
    `;
    xContainer.innerHTML = `
      <span id="axis-label-left">←</span>
      <span id="axis-label-center">0</span>
      <span id="axis-label-right">→</span>
    `;
    this.wrapper.appendChild(xContainer);
    this.axisLabelLeft = xContainer.querySelector('#axis-label-left');
    this.axisLabelCenter = xContainer.querySelector('#axis-label-center');
    this.axisLabelRight = xContainer.querySelector('#axis-label-right');

    // Etykiety Y (góra i dół)
    const yTop = document.createElement('div');
    yTop.className = 'axis-label-y-top axis-label-overlay-y';
    yTop.style.cssText = `
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 10;
      font-size: 10px;
      color: var(--text-secondary, #475569);
      font-weight: 600;
      opacity: 0.7;
      font-family: monospace;
      user-select: none;
    `;
    this.wrapper.appendChild(yTop);

    const yBottom = document.createElement('div');
    yBottom.className = 'axis-label-y-bottom axis-label-overlay-y';
    yBottom.style.cssText = `
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 10;
      font-size: 10px;
      color: var(--text-secondary, #475569);
      font-weight: 600;
      opacity: 0.7;
      font-family: monospace;
      user-select: none;
    `;
    this.wrapper.appendChild(yBottom);

    this.axisLabelYTop = yTop;
    this.axisLabelYBottom = yBottom;
  }

  setupEvents() {
    const canvas = this.canvas;
    const wrapper = this.wrapper;

    // Zoom kółkiem
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;

      const dataCoords = this.screenToData(mouseX, mouseY);

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      let newScale = this.viewport.scale * delta;
      newScale = Math.min(Math.max(newScale, 1), 50); // skala >= 1

      const oldScale = this.viewport.scale;
      const scaleRatio = newScale / oldScale;

      // Oblicz nowe przesunięcie, aby punkt pod kursorem został
      let newOffsetX = this.viewport.offsetX + (dataCoords.x - this.viewport.offsetX) * (1 - scaleRatio);
      let newOffsetY = this.viewport.offsetY + (dataCoords.y - this.viewport.offsetY) * (1 - scaleRatio);

      // Ogranicz przesunięcie, aby nie wyjść poza zakres -10..10
      const halfRange = this.dataRange / 2; // 10
      const visibleHalf = halfRange / newScale; // połowa widocznego zakresu
      newOffsetX = Math.min(Math.max(newOffsetX, -halfRange + visibleHalf), halfRange - visibleHalf);
      newOffsetY = Math.min(Math.max(newOffsetY, -halfRange + visibleHalf), halfRange - visibleHalf);

      this.viewport.scale = newScale;
      this.viewport.offsetX = newOffsetX;
      this.viewport.offsetY = newOffsetY;

      this.render();
      this.updateAxisLabels();
    }, { passive: false });

    // Przeciąganie (pan)
    const startDrag = (e) => {
      const pos = this.getEventPos(e);
      this.isDragging = true;
      this.dragStartX = pos.x;
      this.dragStartY = pos.y;
      this.dragStartOffsetX = this.viewport.offsetX;
      this.dragStartOffsetY = this.viewport.offsetY;
      canvas.style.cursor = 'grabbing';
    };

    const moveDrag = (e) => {
      if (!this.isDragging) return;
      const pos = this.getEventPos(e);
      const dx = pos.x - this.dragStartX;
      const dy = pos.y - this.dragStartY;

      const dataRangeX = this.getDataRangeX();
      const dataRangeY = this.getDataRangeY();
      const pixelToDataX = dataRangeX / this.baseSize;
      const pixelToDataY = dataRangeY / this.baseSize;

      let newOffsetX = this.dragStartOffsetX - dx * pixelToDataX;
      let newOffsetY = this.dragStartOffsetY + dy * pixelToDataY;

      // Ograniczenie przesunięcia
      const halfRange = this.dataRange / 2;
      const visibleHalf = halfRange / this.viewport.scale;
      newOffsetX = Math.min(Math.max(newOffsetX, -halfRange + visibleHalf), halfRange - visibleHalf);
      newOffsetY = Math.min(Math.max(newOffsetY, -halfRange + visibleHalf), halfRange - visibleHalf);

      this.viewport.offsetX = newOffsetX;
      this.viewport.offsetY = newOffsetY;

      this.render();
      this.updateAxisLabels();
    };

    const endDrag = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    // Dotyk
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        const rect = canvas.getBoundingClientRect();
        startDrag({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        moveDrag({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      endDrag();
    }, { passive: false });

    // Podwójne kliknięcie reset
    canvas.addEventListener('dblclick', () => {
      this.viewport.offsetX = 0;
      this.viewport.offsetY = 0;
      this.viewport.scale = 1;
      this.render();
      this.updateAxisLabels();
    });
  }

  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top)
    };
  }

  getDataRangeX() {
    return this.dataRange / this.viewport.scale;
  }

  getDataRangeY() {
    return this.dataRange / this.viewport.scale;
  }

  screenToData(screenX, screenY) {
    // screenX, screenY w zakresie 0-1 (ułamek szerokości/wysokości canvas)
    const dataRange = this.getDataRangeX(); // obie osie takie same
    const dataX = (screenX - 0.5) * dataRange + this.viewport.offsetX;
    const dataY = -(screenY - 0.5) * dataRange + this.viewport.offsetY;
    return { x: dataX, y: dataY };
  }

  dataToScreen(dataX, dataY) {
    const dataRange = this.getDataRangeX();
    const screenX = (dataX - this.viewport.offsetX) / dataRange + 0.5;
    const screenY = -(dataY - this.viewport.offsetY) / dataRange + 0.5;
    return { x: screenX, y: screenY };
  }

  resize() {
    const rect = this.wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    // Ustaw wymiary canvas
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(dpr, dpr);

    // Oblicz kwadratowy obszar wykresu (wyśrodkowany)
    this.baseSize = Math.min(width, height);
    this.offsetXCanvas = (width - this.baseSize) / 2;
    this.offsetYCanvas = (height - this.baseSize) / 2;

    this.logicalWidth = width;
    this.logicalHeight = height;
    this.dpr = dpr;

    this.render();
    this.updateAxisLabels();
  }

  updateAxisLabels() {
    if (!this.axisLabelCenter) return;

    const centerX = this.viewport.offsetX;
    const centerY = this.viewport.offsetY;
    const halfRange = this.dataRange / 2;
    const visibleHalf = halfRange / this.viewport.scale;

    const leftX = centerX - visibleHalf;
    const rightX = centerX + visibleHalf;
    const topY = centerY + visibleHalf;
    const bottomY = centerY - visibleHalf;

    const fmt = (v) => {
      const abs = Math.abs(v);
      if (abs >= 10) return Math.round(v).toString();
      if (abs >= 1) return v.toFixed(1);
      if (abs >= 0.01) return v.toFixed(2);
      return v.toExponential(1);
    };

    this.axisLabelLeft.textContent = fmt(leftX);
    this.axisLabelCenter.textContent = fmt(centerX);
    this.axisLabelRight.textContent = fmt(rightX);
    this.axisLabelYTop.textContent = fmt(topY);
    this.axisLabelYBottom.textContent = fmt(bottomY);
  }

  // ===== METODY PUBLICZNE =====

  updateMarker(x, y) {
    this.userX = x;
    this.userY = y;
    this.render();
  }

  updateActivePairs(count) {
    this.activePairs = count;
    this.render();
  }

  updateModeLabel(mode) {
    this.mode = mode || this.mode;
    this.modeLabel = this.getModeLabel();
    this.render();
  }

  setMode(mode) {
    this.mode = mode;
    this.modeLabel = this.getModeLabel();
    this.onModeChange(mode);
    this.render();
  }

  setCreativeConfig(config) {
    this.creativeConfig = config;
    this.updateLabels();
    this.onCreativeConfigChange(config);
    this.render();
  }

  updateLabels() {
    this.render();
  }

  addOverlay(logoUrl, x, y, type, name, description) {
    this.overlays.push({
      logoUrl,
      x,
      y,
      type: type || 'unknown',
      name: name || '',
      description: description || ''
    });
    // Załaduj obrazek do cache
    if (logoUrl && !this.imageCache[logoUrl]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => {
        this.imageCache[logoUrl] = img;
        this.render();
      };
      img.onerror = () => {
        this.imageCache[logoUrl] = null; // fallback
        this.render();
      };
    }
    this.render();
  }

  clearOverlays() {
    this.overlays = [];
    this.render();
  }

  destroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.canvas.remove();
    this.container.innerHTML = '';
  }

  // ===== RENDEROWANIE =====

  render() {
    const ctx = this.ctx;
    const w = this.logicalWidth || this.canvas.width / (this.dpr || 1);
    const h = this.logicalHeight || this.canvas.height / (this.dpr || 1);
    if (w === 0 || h === 0) return;

    const dpr = this.dpr || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(dpr, dpr);

    // Przesunięcie do kwadratowego obszaru
    ctx.save();
    ctx.translate(this.offsetXCanvas, this.offsetYCanvas);

    // Rozmiar obszaru wykresu
    const size = this.baseSize;
    const halfSize = size / 2;

    // ---- Tło (ćwiartki) ----
    this.drawQuadrants(ctx, size);

    // ---- Siatka ----
    this.drawGrid(ctx, size);

    // ---- Etykiety osi (strzałki) ----
    this.drawAxisArrows(ctx, size);

    // ---- Nakładki ----
    this.drawOverlays(ctx, size);

    // ---- Znacznik użytkownika ----
    this.drawUserMarker(ctx, size);

    // ---- Etykiety narożne (tryb kreatywny) ----
    this.drawCornerLabels(ctx, size);

    ctx.restore();
    ctx.restore();
  }

  drawQuadrants(ctx, size) {
    const half = size / 2;

    // Kolory dokładnie takie jak w starym kompasie (bez przezroczystości)
    const colors = [
      { x: 0, y: 0, color: '#DD0000' },      // TL
      { x: half, y: 0, color: '#0183be' },   // TR
      { x: 0, y: half, color: '#101010' },   // BL
      { x: half, y: half, color: '#F4DC00' } // BR
    ];

    for (const q of colors) {
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, half, half);
    }

    // Kreski (jak w starym kompasie) – dodajemy delikatne linie
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    // Poziome i pionowe linie w każdej ćwiartce (co 10% rozmiaru)
    for (let i = 0; i < 10; i++) {
      const pos = (i / 10) * half;
      // pionowe w lewej górnej
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, half);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(half + pos, 0);
      ctx.lineTo(half + pos, half);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, half);
      ctx.lineTo(pos, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(half + pos, half);
      ctx.lineTo(half + pos, size);
      ctx.stroke();
      // poziome
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(half, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(half, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, half + pos);
      ctx.lineTo(half, half + pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(half, half + pos);
      ctx.lineTo(size, half + pos);
      ctx.stroke();
    }

    // Linie krzyża (środkowe)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, size);
    ctx.moveTo(0, half);
    ctx.lineTo(size, half);
    ctx.stroke();
  }

  drawGrid(ctx, size) {
    const halfRange = this.dataRange / 2; // 10
    const visibleHalf = halfRange / this.viewport.scale;

    // Oblicz odstęp siatki
    let spacing = this.calculateGridSpacing(visibleHalf * 2);

    const centerX = this.viewport.offsetX;
    const centerY = this.viewport.offsetY;

    // Konwersja danych na piksele w obrębie kwadratowego obszaru
    const dataToPixel = (dataX, dataY) => {
      const px = (dataX - centerX + visibleHalf) / (2 * visibleHalf) * size;
      const py = (centerY + visibleHalf - dataY) / (2 * visibleHalf) * size;
      return { px, py };
    };

    // Rysuj linie siatki
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;

    const startX = Math.ceil((-halfRange - centerX) / spacing) * spacing;
    const endX = Math.floor((halfRange - centerX) / spacing) * spacing;
    for (let v = startX; v <= endX; v += spacing) {
      if (Math.abs(v) < 0.0001) continue;
      const { px } = dataToPixel(v, 0);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, size);
      ctx.stroke();
    }

    const startY = Math.ceil((-halfRange - centerY) / spacing) * spacing;
    const endY = Math.floor((halfRange - centerY) / spacing) * spacing;
    for (let v = startY; v <= endY; v += spacing) {
      if (Math.abs(v) < 0.0001) continue;
      const { py } = dataToPixel(0, v);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(size, py);
      ctx.stroke();
    }

    // Główne linie co 5
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    for (let v = -10; v <= 10; v += 5) {
      if (Math.abs(v) < 0.0001) continue;
      const { px } = dataToPixel(v, 0);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, size);
      ctx.stroke();
      const { py } = dataToPixel(0, v);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(size, py);
      ctx.stroke();
    }

    // Etykiety liczbowe przy większym zoomie
    if (this.viewport.scale > 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let v = startX; v <= endX; v += spacing) {
        if (Math.abs(v) < 0.001) continue;
        const { px } = dataToPixel(v, 0);
        if (px < 10 || px > size - 10) continue;
        ctx.fillText(this.formatNumber(v), px, halfSize + 4);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let v = startY; v <= endY; v += spacing) {
        if (Math.abs(v) < 0.001) continue;
        const { py } = dataToPixel(0, v);
        if (py < 10 || py > size - 10) continue;
        ctx.fillText(this.formatNumber(v), halfSize - 6, py);
      }
      // Zero
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('0', halfSize + 2, halfSize + 4);
    }
  }

  calculateGridSpacing(range) {
    const targetLines = 10;
    let spacing = range / targetLines;
    const niceValues = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
    let best = niceValues[0];
    for (const v of niceValues) {
      if (Math.abs(v - spacing) < Math.abs(best - spacing)) best = v;
    }
    return best;
  }

  formatNumber(v) {
    const abs = Math.abs(v);
    if (abs >= 10) return Math.round(v).toString();
    if (abs >= 1) return v.toFixed(1);
    if (abs >= 0.01) return v.toFixed(2);
    return v.toExponential(1);
  }

  drawAxisArrows(ctx, size) {
    const half = size / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    // Strzałki na krawędziach
    const arrowSize = 8;
    // Prawa
    ctx.beginPath();
    ctx.moveTo(size - 4, half - 6);
    ctx.lineTo(size - 2, half);
    ctx.lineTo(size - 4, half + 6);
    ctx.fill();
    // Lewa
    ctx.beginPath();
    ctx.moveTo(4, half - 6);
    ctx.lineTo(2, half);
    ctx.lineTo(4, half + 6);
    ctx.fill();
    // Góra
    ctx.beginPath();
    ctx.moveTo(half - 6, 4);
    ctx.lineTo(half, 2);
    ctx.lineTo(half + 6, 4);
    ctx.fill();
    // Dół
    ctx.beginPath();
    ctx.moveTo(half - 6, size - 4);
    ctx.lineTo(half, size - 2);
    ctx.lineTo(half + 6, size - 4);
    ctx.fill();
  }

  drawCornerLabels(ctx, size) {
    const labels = this.creativeConfig.labels || { top: 'Heteronomia', bottom: 'Autonomia', left: 'Socjalizm', right: 'Kapitalizm' };
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 11px sans-serif';
    const half = size / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels.top, half, 16);

    ctx.textBaseline = 'top';
    ctx.fillText(labels.bottom, half, size - 16);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(16, half);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels.left, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(size - 16, half);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(labels.right, 0, 0);
    ctx.restore();
  }

  drawUserMarker(ctx, size) {
    const half = size / 2;
    const halfRange = this.dataRange / 2;
    const visibleHalf = halfRange / this.viewport.scale;

    const dataToPixel = (dataX, dataY) => {
      const px = (dataX - this.viewport.offsetX + visibleHalf) / (2 * visibleHalf) * size;
      const py = (this.viewport.offsetY + visibleHalf - dataY) / (2 * visibleHalf) * size;
      return { px, py };
    };

    const { px, py } = dataToPixel(this.userX, this.userY);
    if (px < -20 || px > size + 20 || py < -20 || py > size + 20) return;

    const radius = 8;
    const isDark = document.body.classList.contains('dark');

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    // Pulsujący pierścień
    const time = Date.now() / 1000;
    const pulse = 1 + 0.15 * Math.sin(time * 1.8);
    const ringRadius = radius * 1.6 * pulse;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(34, 197, 94, 0.2)';
    ctx.fill();

    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(px - radius*0.3, py - radius*0.3, 0, px, py, radius);
    if (isDark) {
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(0.7, '#eab308');
      grad.addColorStop(1, '#a16207');
    } else {
      grad.addColorStop(0, '#86efac');
      grad.addColorStop(0.7, '#22c55e');
      grad.addColorStop(1, '#15803d');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = isDark ? '#0a0f1c' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawOverlays(ctx, size) {
    const half = size / 2;
    const halfRange = this.dataRange / 2;
    const visibleHalf = halfRange / this.viewport.scale;

    const dataToPixel = (dataX, dataY) => {
      const px = (dataX - this.viewport.offsetX + visibleHalf) / (2 * visibleHalf) * size;
      const py = (this.viewport.offsetY + visibleHalf - dataY) / (2 * visibleHalf) * size;
      return { px, py };
    };

    const overlaySize = 18; // stały rozmiar w pikselach

    for (const overlay of this.overlays) {
      const { px, py } = dataToPixel(overlay.x, overlay.y);
      if (px < -30 || px > size + 30 || py < -30 || py > size + 30) continue;

      // Spróbuj narysować obrazek
      const img = this.imageCache[overlay.logoUrl];
      if (img && img.complete && img.naturalWidth > 0) {
        // Rysuj obrazek
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        // Przycięcie do koła (jeśli obrazek ma przezroczystość, będzie okrągły)
        ctx.beginPath();
        ctx.arc(px, py, overlaySize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, px - overlaySize/2, py - overlaySize/2, overlaySize, overlaySize);
        ctx.restore();

        // Obrys
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, overlaySize/2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Fallback – kolorowe kółko z inicjałem
        const bgColor = overlay.type === 'party' ? 'rgba(59, 130, 246, 0.7)' :
                        overlay.type === 'ideology' ? 'rgba(139, 92, 246, 0.7)' :
                        overlay.type === 'user' ? 'rgba(34, 197, 94, 0.7)' :
                        'rgba(100, 100, 100, 0.6)';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(px, py, overlaySize/2, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = (overlay.name || '?')[0].toUpperCase();
        ctx.fillText(initial, px, py + 0.5);
      }

      // Etykieta nazwy przy dużym zoomie
      if (this.viewport.scale > 4) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(overlay.name, px, py - overlaySize/2 - 4);
      }
    }
  }

  // ===== METODY DLA PANELU KREATYWNEGO (zgodność) =====

  setCreativeConfigPanel(areaElement, listContainer, topInput, bottomInput, leftInput, rightInput, applyLabelsBtn, applyCreativeBtn) {
    this.creativeArea = areaElement;
    this.creativeListContainer = listContainer;
    this.creativeTopInput = topInput;
    this.creativeBottomInput = bottomInput;
    this.creativeLeftInput = leftInput;
    this.creativeRightInput = rightInput;
    this.applyLabelsBtn = applyLabelsBtn;
    this.applyCreativeBtn = applyCreativeBtn;

    if (this.applyLabelsBtn) {
      this.applyLabelsBtn.onclick = () => {
        this.creativeConfig.labels = {
          top: this.creativeTopInput.value,
          bottom: this.creativeBottomInput.value,
          left: this.creativeLeftInput.value,
          right: this.creativeRightInput.value
        };
        this.updateLabels();
        this.onCreativeConfigChange(this.creativeConfig);
      };
    }

    if (this.applyCreativeBtn) {
      this.applyCreativeBtn.onclick = () => {
        const active = [];
        const rows = this.creativeListContainer.querySelectorAll('.creative-pair-row');
        rows.forEach(row => {
          const cb = row.querySelector('.creative-active-cb');
          if (cb && cb.checked) {
            const id = cb.dataset.id;
            const axis = row.querySelector('.creative-axis-select').value;
            const weight = parseFloat(row.querySelector('.creative-weight-input').value);
            const direction = parseInt(row.querySelector('.creative-direction-select').value, 10) || 1;
            if (!isNaN(weight)) active.push({ pairId: id, axis, weight, direction });
          }
        });
        this.creativeConfig.activePairs = active;
        this.onCreativeConfigChange(this.creativeConfig);
      };
    }

    this.renderCreativePairsList();
  }

  renderCreativePairsList() {
    if (!this.creativeListContainer) return;
    this.creativeListContainer.innerHTML = '';
    const allPairs = [...window.corePairs, ...window.extraPairs];
    for (const pair of allPairs) {
      const existing = this.creativeConfig.activePairs.find(c => c.pairId === pair.id);
      const isActive = !!existing;
      const axisVal = existing ? existing.axis : (pair.axis || 'x');
      const weightVal = existing ? existing.weight : pair.weight;
      const directionVal = existing ? (existing.direction || 1) : 1;
      const row = document.createElement('div');
      row.className = 'creative-pair-row';
      row.innerHTML = `
        <label style="display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" class="creative-active-cb" data-id="${pair.id}" ${isActive ? 'checked' : ''}>
          <span>${pair.negativeLabel} ⇄ ${pair.positiveLabel}</span>
        </label>
        <select class="creative-axis-select" data-id="${pair.id}" ${!isActive ? 'disabled' : ''}>
          <option value="x" ${axisVal === 'x' ? 'selected' : ''}>Oś X</option>
          <option value="y" ${axisVal === 'y' ? 'selected' : ''}>Oś Y</option>
        </select>
        <select class="creative-direction-select" data-id="${pair.id}" ${!isActive ? 'disabled' : ''}>
          <option value="1" ${directionVal === 1 ? 'selected' : ''}>${pair.positiveLabel} -> +</option>
          <option value="-1" ${directionVal === -1 ? 'selected' : ''}>${pair.negativeLabel} -> +</option>
        </select>
        <input type="number" step="0.1" class="creative-weight-input" data-id="${pair.id}" value="${weightVal}" ${!isActive ? 'disabled' : ''} style="width: 70px;">
      `;
      const cb = row.querySelector('.creative-active-cb');
      const axisSel = row.querySelector('.creative-axis-select');
      const directionSel = row.querySelector('.creative-direction-select');
      const weightInp = row.querySelector('.creative-weight-input');
      cb.addEventListener('change', (e) => {
        const checked = e.target.checked;
        axisSel.disabled = !checked;
        directionSel.disabled = !checked;
        weightInp.disabled = !checked;
      });
      this.creativeListContainer.appendChild(row);
    }
  }
}
