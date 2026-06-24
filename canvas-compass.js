// canvas-compass.js – interaktywny kompas na canvas z zoomem i przesuwaniem

class CanvasCompass {
  /**
   * @param {HTMLElement} container - element, w którym zostanie umieszczony canvas
   * @param {Object} options
   * @param {string} options.mode - tryb kompasu ('weighted', 'equal', 'institutional', 'creative')
   * @param {Object} options.creativeConfig - konfiguracja kreatywna
   * @param {Function} options.onModeChange - callback przy zmianie trybu
   * @param {Function} options.onCreativeConfigChange - callback przy zmianie konfiguracji kreatywnej
   */
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
      scale: 1,        // skala (1 = domyślny widok od -10 do 10)
    };

    // Dane
    this.userX = 0;
    this.userY = 0;
    this.activePairs = 0;
    this.modeLabel = this.getModeLabel();

    // Nakładki (partie, ideologie, użytkownicy)
    this.overlays = [];

    // Stan przeciągania
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartOffsetX = 0;
    this.dragStartOffsetY = 0;

    // Czy canvas jest gotowy
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
    // Usuń zawartość kontenera
    this.container.innerHTML = '';

    // Stwórz wrapper dla canvas (zapewnia responsywność)
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = 'width: 100%; height: 100%; position: relative; overflow: hidden; touch-action: none;';
    this.container.appendChild(this.wrapper);

    // Stwórz canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display: block; width: 100%; height: 100%; background: transparent; cursor: grab;';
    this.wrapper.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Obsługa zdarzeń
    this.setupEvents();

    // Obserwator zmiany rozmiaru
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.wrapper);

    // Dodatkowe elementy UI – etykiety osi (subtelna skala)
    this.createAxisLabels();

    // Wstępne wymiarowanie
    requestAnimationFrame(() => {
      this.resize();
      this.render();
      this.ready = true;
    });

    // Etykiety w ramce – aktualizacja przy zmianie konfiguracji
    this.updateLabels();
  }

  createAxisLabels() {
    // Usuń stare etykiety
    const oldLabels = this.wrapper.querySelectorAll('.axis-label-overlay');
    oldLabels.forEach(el => el.remove());

    // Kontener na etykiety osi
    const labelContainer = document.createElement('div');
    labelContainer.className = 'axis-label-overlay';
    labelContainer.style.cssText = `
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
    labelContainer.innerHTML = `
      <span id="axis-label-left">←</span>
      <span id="axis-label-center">0</span>
      <span id="axis-label-right">→</span>
    `;
    this.wrapper.appendChild(labelContainer);

    // Etykiety dla osi Y (po lewej i prawej stronie)
    const yLabelLeft = document.createElement('div');
    yLabelLeft.className = 'axis-label-overlay-y';
    yLabelLeft.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      pointer-events: none;
      z-index: 10;
      font-size: 10px;
      color: var(--text-secondary, #475569);
      font-weight: 600;
      opacity: 0.7;
      font-family: monospace;
      user-select: none;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
    `;
    yLabelLeft.textContent = '↑';
    this.wrapper.appendChild(yLabelLeft);

    const yLabelRight = document.createElement('div');
    yLabelRight.className = 'axis-label-overlay-y';
    yLabelRight.style.cssText = `
      position: absolute;
      top: 4px;
      right: 4px;
      pointer-events: none;
      z-index: 10;
      font-size: 10px;
      color: var(--text-secondary, #475569);
      font-weight: 600;
      opacity: 0.7;
      font-family: monospace;
      user-select: none;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    `;
    yLabelRight.textContent = '↓';
    this.wrapper.appendChild(yLabelRight);

    this.axisLabelLeft = labelContainer.querySelector('#axis-label-left');
    this.axisLabelCenter = labelContainer.querySelector('#axis-label-center');
    this.axisLabelRight = labelContainer.querySelector('#axis-label-right');
  }

  setupEvents() {
    const canvas = this.canvas;
    const wrapper = this.wrapper;

    // === Zoom kółkiem myszy ===
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;

      // Oblicz współrzędne danych pod kursorem (przed zoomem)
      const dataCoords = this.screenToData(mouseX, mouseY);

      // Zmiana skali
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(this.viewport.scale * delta, 0.1), 50);

      // Oblicz nowe przesunięcie, aby punkt pod kursorem pozostał w tym samym miejscu
      const oldScale = this.viewport.scale;
      const scaleRatio = newScale / oldScale;

      // Nowe przesunięcie = stare + (pozycja kursora w danych - stare przesunięcie) * (1 - scaleRatio)
      this.viewport.offsetX = this.viewport.offsetX + (dataCoords.x - this.viewport.offsetX) * (1 - scaleRatio);
      this.viewport.offsetY = this.viewport.offsetY + (dataCoords.y - this.viewport.offsetY) * (1 - scaleRatio);
      this.viewport.scale = newScale;

      this.render();
      this.updateAxisLabels();
    }, { passive: false });

    // === Przeciąganie (pan) ===
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

      // Przesunięcie w jednostkach danych
      const dataRangeX = this.getDataRangeX();
      const dataRangeY = this.getDataRangeY();
      const pixelToDataX = dataRangeX / this.canvas.width;
      const pixelToDataY = dataRangeY / this.canvas.height;

      this.viewport.offsetX = this.dragStartOffsetX - dx * pixelToDataX;
      this.viewport.offsetY = this.dragStartOffsetY + dy * pixelToDataY;

      this.render();
      this.updateAxisLabels();
    };

    const endDrag = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    // Mysz
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);

    // Dotyk (urządzenia mobilne)
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

    // Podwójne kliknięcie – reset widoku
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
    // Zakres danych widoczny na ekranie (w jednostkach danych)
    const totalWidth = this.canvas.width;
    const halfWidth = totalWidth / 2;
    // Zakres danych = 20 jednostek (od -10 do 10) podzielone przez skalę
    // plus przesunięcie
    const range = 20 / this.viewport.scale;
    return range;
  }

  getDataRangeY() {
    const totalHeight = this.canvas.height;
    const halfHeight = totalHeight / 2;
    const range = 20 / this.viewport.scale;
    return range;
  }

  screenToData(screenX, screenY) {
    // screenX, screenY w zakresie 0-1 (ułamek szerokości/wysokości)
    const dataRangeX = this.getDataRangeX();
    const dataRangeY = this.getDataRangeY();
    const dataX = (screenX - 0.5) * dataRangeX + this.viewport.offsetX;
    const dataY = -(screenY - 0.5) * dataRangeY + this.viewport.offsetY;
    return { x: dataX, y: dataY };
  }

  dataToScreen(dataX, dataY) {
    const dataRangeX = this.getDataRangeX();
    const dataRangeY = this.getDataRangeY();
    const screenX = (dataX - this.viewport.offsetX) / dataRangeX + 0.5;
    const screenY = -(dataY - this.viewport.offsetY) / dataRangeY + 0.5;
    return { x: screenX, y: screenY };
  }

  resize() {
    const rect = this.wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    // Skala dla rysowania (aby linie były ostre)
    this.ctx.scale(dpr, dpr);

    // Zapisz wymiary logiczne
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.dpr = dpr;

    this.render();
    this.updateAxisLabels();
  }

  updateAxisLabels() {
    if (!this.axisLabelCenter) return;

    // Pokaż współrzędne środka widoku
    const centerDataX = this.viewport.offsetX;
    const centerDataY = this.viewport.offsetY;

    // Oblicz wartości na krawędziach
    const dataRangeX = this.getDataRangeX();
    const dataRangeY = this.getDataRangeY();
    const leftX = centerDataX - dataRangeX / 2;
    const rightX = centerDataX + dataRangeX / 2;
    const topY = centerDataY + dataRangeY / 2;
    const bottomY = centerDataY - dataRangeY / 2;

    // Formatowanie liczb
    const fmt = (v) => {
      const abs = Math.abs(v);
      if (abs >= 10) return Math.round(v);
      if (abs >= 1) return v.toFixed(1);
      if (abs >= 0.01) return v.toFixed(2);
      return v.toExponential(1);
    };

    if (this.axisLabelLeft) this.axisLabelLeft.textContent = fmt(leftX);
    if (this.axisLabelCenter) this.axisLabelCenter.textContent = fmt(centerDataX);
    if (this.axisLabelRight) this.axisLabelRight.textContent = fmt(rightX);

    // Etykiety Y - aktualizuj istniejące lub stwórz nowe
    let yTop = this.wrapper.querySelector('.axis-label-y-top');
    let yBottom = this.wrapper.querySelector('.axis-label-y-bottom');

    if (!yTop) {
      yTop = document.createElement('div');
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
    }
    if (!yBottom) {
      yBottom = document.createElement('div');
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
    }

    yTop.textContent = fmt(topY);
    yBottom.textContent = fmt(bottomY);
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
    // Aktualizacja etykiet w ramce (jeśli istnieją)
    const labels = this.creativeConfig.labels || { top: 'Heteronomia', bottom: 'Autonomia', left: 'Socjalizm', right: 'Kapitalizm' };
    // Etykiety są rysowane na canvas, więc nie ma potrzeby aktualizować divów
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
    this.render();
  }

  clearOverlays() {
    this.overlays = [];
    this.render();
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    // Usuń nasłuchiwacze zdarzeń
    // (w praktyce można po prostu usunąć canvas)
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

    // --- Tło ---
    this.drawBackground(ctx, w, h);

    // --- Siatka ---
    this.drawGrid(ctx, w, h);

    // --- Etykiety osi ---
    this.drawAxisLabels(ctx, w, h);

    // --- Nakładki (partie, ideologie, użytkownicy) ---
    this.drawOverlays(ctx, w, h);

    // --- Znacznik użytkownika ---
    this.drawUserMarker(ctx, w, h);

    // --- Etykiety narożne (tryb kreatywny) ---
    this.drawCornerLabels(ctx, w, h);

    ctx.restore();
  }

  drawBackground(ctx, w, h) {
    // Tło – gradient lub jednolity kolor
    const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.8);
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      grad.addColorStop(0, '#1a2744');
      grad.addColorStop(1, '#0a0f1c');
    } else {
      grad.addColorStop(0, '#f0f4f8');
      grad.addColorStop(1, '#dce3ed');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Narysuj cztery ćwiartki z przezroczystością
    const cx = w / 2;
    const cy = h / 2;

    // Ćwiartki (z przezroczystością, aby tło było widoczne)
    const alpha = 0.25;
    const colors = [
      { x: 0, y: 0, color: 'rgba(220, 0, 0, ' + alpha + ')' },      // TL
      { x: cx, y: 0, color: 'rgba(0, 100, 200, ' + alpha + ')' },    // TR
      { x: 0, y: cy, color: 'rgba(20, 20, 30, ' + alpha + ')' },     // BL
      { x: cx, y: cy, color: 'rgba(200, 180, 0, ' + alpha + ')' }    // BR
    ];

    for (const q of colors) {
      ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, cx, cy);
    }

    // Linie podziału (krzyż)
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
  }

  drawGrid(ctx, w, h) {
    const dataRangeX = this.getDataRangeX();
    const dataRangeY = this.getDataRangeY();

    // Oblicz odstęp siatki w jednostkach danych
    let gridSpacing = this.calculateGridSpacing(dataRangeX, dataRangeY);

    const cx = w / 2;
    const cy = h / 2;

    // Przelicz przesunięcie na piksele
    const offsetPxX = -this.viewport.offsetX / dataRangeX * w;
    const offsetPxY = this.viewport.offsetY / dataRangeY * h;

    const isDark = document.body.classList.contains('dark');

    // --- Linie siatki ---
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 0.5;

    // Linie pionowe
    const startX = Math.ceil((-10 - this.viewport.offsetX) / gridSpacing) * gridSpacing;
    const endX = Math.floor((10 - this.viewport.offsetX) / gridSpacing) * gridSpacing;
    for (let v = startX; v <= endX; v += gridSpacing) {
      const px = cx + (v - this.viewport.offsetX) / dataRangeX * w;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }

    // Linie poziome
    const startY = Math.ceil((-10 - this.viewport.offsetY) / gridSpacing) * gridSpacing;
    const endY = Math.floor((10 - this.viewport.offsetY) / gridSpacing) * gridSpacing;
    for (let v = startY; v <= endY; v += gridSpacing) {
      const py = cy - (v - this.viewport.offsetY) / dataRangeY * h;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // --- Linie główne (co 5 jednostek) ---
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;

    const majorSpacing = 5;
    // Pionowe co 5
    for (let v = -10; v <= 10; v += majorSpacing) {
      const px = cx + (v - this.viewport.offsetX) / dataRangeX * w;
      if (px < 0 || px > w) continue;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    // Poziome co 5
    for (let v = -10; v <= 10; v += majorSpacing) {
      const py = cy - (v - this.viewport.offsetY) / dataRangeY * h;
      if (py < 0 || py > h) continue;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // --- Etykiety liczbowe na osiach (przy większym zoomie) ---
    if (this.viewport.scale > 2) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Etykiety na osi X
      for (let v = startX; v <= endX; v += gridSpacing) {
        if (Math.abs(v) < 0.001) continue;
        const px = cx + (v - this.viewport.offsetX) / dataRangeX * w;
        if (px < 10 || px > w - 10) continue;
        const label = this.formatNumber(v);
        ctx.fillText(label, px, cy + 4);
      }

      // Etykiety na osi Y
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let v = startY; v <= endY; v += gridSpacing) {
        if (Math.abs(v) < 0.001) continue;
        const py = cy - (v - this.viewport.offsetY) / dataRangeY * h;
        if (py < 10 || py > h - 10) continue;
        const label = this.formatNumber(v);
        ctx.fillText(label, cx - 6, py);
      }

      // Zero na środku
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('0', cx + 2, cy + 4);
    }
  }

  calculateGridSpacing(dataRangeX, dataRangeY) {
    // Wybierz mniejszy zakres, aby siatka była czytelna
    const range = Math.min(dataRangeX, dataRangeY);
    // Pożądana liczba linii siatki: między 6 a 12
    const targetLines = 10;
    let spacing = range / targetLines;

    // Zaokrąglij do ładnej wartości: 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50
    const niceValues = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    let best = niceValues[0];
    for (const v of niceValues) {
      if (Math.abs(v - spacing) < Math.abs(best - spacing)) {
        best = v;
      }
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

  drawAxisLabels(ctx, w, h) {
    // Etykiety osi są rysowane przez elementy HTML (subtelna skala)
    // Tu tylko rysujemy strzałki lub dodatkowe oznaczenia
    const isDark = document.body.classList.contains('dark');
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Strzałki na osiach (małe trójkąty)
    const cx = w / 2;
    const cy = h / 2;

    // Strzałka X (prawa)
    ctx.beginPath();
    ctx.moveTo(w - 12, cy - 6);
    ctx.lineTo(w - 4, cy);
    ctx.lineTo(w - 12, cy + 6);
    ctx.fill();

    // Strzałka X (lewa)
    ctx.beginPath();
    ctx.moveTo(12, cy - 6);
    ctx.lineTo(4, cy);
    ctx.lineTo(12, cy + 6);
    ctx.fill();

    // Strzałka Y (góra)
    ctx.beginPath();
    ctx.moveTo(cx - 6, 12);
    ctx.lineTo(cx, 4);
    ctx.lineTo(cx + 6, 12);
    ctx.fill();

    // Strzałka Y (dół)
    ctx.beginPath();
    ctx.moveTo(cx - 6, h - 12);
    ctx.lineTo(cx, h - 4);
    ctx.lineTo(cx + 6, h - 12);
    ctx.fill();
  }

  drawCornerLabels(ctx, w, h) {
    const labels = this.creativeConfig.labels || { top: 'Heteronomia', bottom: 'Autonomia', left: 'Socjalizm', right: 'Kapitalizm' };
    const isDark = document.body.classList.contains('dark');
    const color = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
    ctx.fillStyle = color;
    ctx.font = 'bold 11px sans-serif';

    // Góra
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels.top, w / 2, 16);

    // Dół
    ctx.textBaseline = 'top';
    ctx.fillText(labels.bottom, w / 2, h - 16);

    // Lewo
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(16, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels.left, 0, 0);
    ctx.restore();

    // Prawo
    ctx.save();
    ctx.translate(w - 16, h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(labels.right, 0, 0);
    ctx.restore();
  }

  drawUserMarker(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const dataRangeX = this.getDataRangeX();
    const dataRangeY = this.getDataRangeY();

    const px = cx + (this.userX - this.viewport.offsetX) / dataRangeX * w;
    const py = cy - (this.userY - this.viewport.offsetY) / dataRangeY * h;

    // Sprawdź, czy znacznik jest widoczny
    if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;

    const radius = 8; // stały rozmiar w pikselach
    const isDark = document.body.classList.contains('dark');

    // Cień
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Zewnętrzny pierścień (pulsujący)
    const time = Date.now() / 1000;
    const pulse = 1 + 0.15 * Math.sin(time * 1.8);
    const ringRadius = radius * 1.6 * pulse;

    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(34, 197, 94, 0.2)';
    ctx.fill();

    // Główny znacznik
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

    // Obrys
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isDark ? '#0a0f1c' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reset cienia
    ctx.shadowBlur = 0;
  }

  drawOverlays(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const dataRangeX = this.getDataRangeX();
    const dataRangeY = this.getDataRangeY();

    const isDark = document.body.classList.contains('dark');

    for (const overlay of this.overlays) {
      const px = cx + (overlay.x - this.viewport.offsetX) / dataRangeX * w;
      const py = cy - (overlay.y - this.viewport.offsetY) / dataRangeY * h;

      // Sprawdź widoczność
      if (px < -30 || px > w + 30 || py < -30 || py > h + 30) continue;

      // Stały rozmiar w pikselach
      const size = 16;
      const half = size / 2;

      // Tło dla czytelności
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      // Rysuj jako okrąg z inicjałem lub ikoną
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(px, py, half + 2, 0, Math.PI * 2);
      const bgColor = overlay.type === 'party' ? 'rgba(59, 130, 246, 0.75)' :
                      overlay.type === 'ideology' ? 'rgba(139, 92, 246, 0.75)' :
                      overlay.type === 'user' ? 'rgba(34, 197, 94, 0.75)' :
                      'rgba(100, 100, 100, 0.6)';
      ctx.fillStyle = bgColor;
      ctx.fill();

      // Obrys
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Inicjał lub pierwsza litera nazwy
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (overlay.name || '?')[0].toUpperCase();
      ctx.fillText(initial, px, py + 0.5);

      // Etykieta nazwy (przy większym zoomie)
      if (this.viewport.scale > 4) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(overlay.name, px, py - half - 4);
      }

      // Reset cienia
      ctx.shadowBlur = 0;
    }
  }

  // ===== METODY DLA PANELU KREATYWNEGO (zgodność z CompassUI) =====

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
