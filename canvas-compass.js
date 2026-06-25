// canvas-compass.js – interaktywny kompas (kwadratowy, wolne przybliżanie, duże punkty, gruba siatka)

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

    // Stan widoku
    this.viewport = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    };
    this.dataRange = 20;

    this.userX = 0;
    this.userY = 0;
    this.activePairs = 0;

    this.overlays = [];
    this.imageCache = {};

    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartOffsetX = 0;
    this.dragStartOffsetY = 0;

    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.drawSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.ready = false;
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = 'width: 100%; height: 100%; position: relative; overflow: hidden; touch-action: none;';
    this.container.appendChild(this.wrapper);

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display: block; width: 100%; height: 100%; background: transparent; cursor: grab;';
    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.setupEvents();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.wrapper);

    this.createAxisLabels();

    requestAnimationFrame(() => {
      this.resize();
      this.render();
      this.ready = true;
    });
  }

  createAxisLabels() {
    this.wrapper.querySelectorAll('.axis-label-overlay, .axis-label-overlay-y, .axis-label-y-top, .axis-label-y-bottom')
      .forEach(el => el.remove());

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
      color: rgba(255,255,255,0.7);
      font-weight: 600;
      font-family: monospace;
      user-select: none;
      text-shadow: 0 0 4px rgba(0,0,0,0.6);
    `;
    xContainer.innerHTML = `<span id="axis-label-left">-10</span><span id="axis-label-center">0</span><span id="axis-label-right">10</span>`;
    this.wrapper.appendChild(xContainer);
    this.axisLabelLeft = xContainer.querySelector('#axis-label-left');
    this.axisLabelCenter = xContainer.querySelector('#axis-label-center');
    this.axisLabelRight = xContainer.querySelector('#axis-label-right');

    const yTop = document.createElement('div');
    yTop.className = 'axis-label-y-top';
    yTop.style.cssText = `
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 10;
      font-size: 10px;
      color: rgba(255,255,255,0.7);
      font-weight: 600;
      font-family: monospace;
      user-select: none;
      text-shadow: 0 0 4px rgba(0,0,0,0.6);
    `;
    yTop.textContent = '10';
    this.wrapper.appendChild(yTop);

    const yBottom = document.createElement('div');
    yBottom.className = 'axis-label-y-bottom';
    yBottom.style.cssText = `
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 10;
      font-size: 10px;
      color: rgba(255,255,255,0.7);
      font-weight: 600;
      font-family: monospace;
      user-select: none;
      text-shadow: 0 0 4px rgba(0,0,0,0.6);
    `;
    yBottom.textContent = '-10';
    this.wrapper.appendChild(yBottom);

    this.axisLabelYTop = yTop;
    this.axisLabelYBottom = yBottom;
  }

  setupEvents() {
    const canvas = this.canvas;

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;

      const dataCoords = this.screenToData(mouseX, mouseY);

      // Bardzo wolne przybliżanie
      const delta = e.deltaY > 0 ? 0.98 : 1.02;
      let newScale = this.viewport.scale * delta;
      newScale = Math.max(newScale, 1);

      const oldScale = this.viewport.scale;
      const scaleRatio = newScale / oldScale;

      let newOffsetX = this.viewport.offsetX + (dataCoords.x - this.viewport.offsetX) * (1 - scaleRatio);
      let newOffsetY = this.viewport.offsetY + (dataCoords.y - this.viewport.offsetY) * (1 - scaleRatio);

      const halfRange = this.dataRange / 2;
      const visibleHalf = halfRange / newScale;
      newOffsetX = Math.min(Math.max(newOffsetX, -halfRange + visibleHalf), halfRange - visibleHalf);
      newOffsetY = Math.min(Math.max(newOffsetY, -halfRange + visibleHalf), halfRange - visibleHalf);

      this.viewport.scale = newScale;
      this.viewport.offsetX = newOffsetX;
      this.viewport.offsetY = newOffsetY;

      this.resize(); // aktualizacja wymiarów (kwadrat zawsze)
      this.render();
      this.updateAxisLabels();
    }, { passive: false });

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

      const dataRange = this.dataRange / this.viewport.scale;
      const pixelToDataX = dataRange / this.drawSize;
      const pixelToDataY = dataRange / this.drawSize;

      let newOffsetX = this.dragStartOffsetX - dx * pixelToDataX;
      let newOffsetY = this.dragStartOffsetY + dy * pixelToDataY;

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

    canvas.addEventListener('dblclick', () => {
      this.viewport.offsetX = 0;
      this.viewport.offsetY = 0;
      this.viewport.scale = 1;
      this.resize();
      this.render();
      this.updateAxisLabels();
    });
  }

  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left), y: (e.clientY - rect.top) };
  }

  screenToData(screenX, screenY) {
    const dataRange = this.dataRange / this.viewport.scale;
    const dataX = (screenX - 0.5) * dataRange + this.viewport.offsetX;
    const dataY = -(screenY - 0.5) * dataRange + this.viewport.offsetY;
    return { x: dataX, y: dataY };
  }

  dataToScreen(dataX, dataY) {
    const dataRange = this.dataRange / this.viewport.scale;
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

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.scale(dpr, dpr);

    this.canvasWidth = width;
    this.canvasHeight = height;
    this.dpr = dpr;

    // Zawsze kwadrat (niezależnie od skali)
    this.drawSize = Math.min(width, height);
    this.offsetX = (width - this.drawSize) / 2;
    this.offsetY = (height - this.drawSize) / 2;

    this.render();
    this.updateAxisLabels();
  }

  updateAxisLabels() {
    const halfRange = this.dataRange / 2;
    const visibleHalf = halfRange / this.viewport.scale;
    const centerX = this.viewport.offsetX;
    const centerY = this.viewport.offsetY;

    const fmt = (v) => {
      const abs = Math.abs(v);
      if (abs >= 10) return Math.round(v).toString();
      if (abs >= 1) return v.toFixed(1);
      if (abs >= 0.01) return v.toFixed(2);
      return v.toExponential(1);
    };

    this.axisLabelLeft.textContent = fmt(centerX - visibleHalf);
    this.axisLabelCenter.textContent = fmt(centerX);
    this.axisLabelRight.textContent = fmt(centerX + visibleHalf);
    this.axisLabelYTop.textContent = fmt(centerY + visibleHalf);
    this.axisLabelYBottom.textContent = fmt(centerY - visibleHalf);
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
    this.render();
  }

  setMode(mode) {
    this.mode = mode;
    this.onModeChange(mode);
    this.render();
  }

  setCreativeConfig(config) {
    this.creativeConfig = config;
    this.render();
  }

  addOverlay(logoUrl, x, y, type, name, description) {
    this.overlays.push({ logoUrl, x, y, type, name, description });
    if (logoUrl && !this.imageCache[logoUrl]) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      img.onload = () => {
        this.imageCache[logoUrl] = img;
        this.render();
      };
      img.onerror = () => {
        this.imageCache[logoUrl] = null;
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
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    if (w === 0 || h === 0) return;

    const dpr = this.dpr || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(dpr, dpr);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);

    const size = this.drawSize;
    const halfSize = size / 2;

    // ---- Tło i siatka ćwiartek (z kolorowymi liniami) ----
    this.drawQuadrantsWithGrid(ctx, size);

    // ---- Etykiety narożne ----
    this.drawCornerLabels(ctx, size);

    // ---- Nakładki ----
    this.drawOverlays(ctx, size);

    // ---- Znacznik użytkownika ----
    this.drawUserMarker(ctx, size);

    ctx.restore();
    ctx.restore();
  }

  drawQuadrantsWithGrid(ctx, size) {
    const half = size / 2;

    const quadrants = [
      { x: 0, y: 0, bg: '#DD0000', gridColor: 'rgba(127,0,0,0.7)' },
      { x: half, y: 0, bg: '#0183be', gridColor: 'rgba(0,59,110,0.7)' },
      { x: 0, y: half, bg: '#101010', gridColor: 'rgba(80,80,80,0.7)' },
      { x: half, y: half, bg: '#F4DC00', gridColor: 'rgba(157,140,0,0.7)' }
    ];

    for (const q of quadrants) {
      ctx.fillStyle = q.bg;
      ctx.fillRect(q.x, q.y, half, half);

      // Grubsza siatka 10x10
      ctx.strokeStyle = q.gridColor;
      ctx.lineWidth = 1.2;
      for (let i = 1; i < 10; i++) {
        const pos = (i / 10) * half;
        ctx.beginPath();
        ctx.moveTo(q.x + pos, q.y);
        ctx.lineTo(q.x + pos, q.y + half);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(q.x, q.y + pos);
        ctx.lineTo(q.x + half, q.y + pos);
        ctx.stroke();
      }
    }

    // Grube linie krzyża
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, size);
    ctx.moveTo(0, half);
    ctx.lineTo(size, half);
    ctx.stroke();
  }

  drawCornerLabels(ctx, size) {
    const labels = this.creativeConfig.labels || { top: 'Heteronomia', bottom: 'Autonomia', left: 'Socjalizm', right: 'Kapitalizm' };
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 12px sans-serif';
    const half = size / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(labels.top, half, 18);

    ctx.textBaseline = 'top';
    ctx.fillText(labels.bottom, half, size - 18);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(20, half);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels.left, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(size - 20, half);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(labels.right, 0, 0);
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  drawUserMarker(ctx, size) {
    const halfRange = this.dataRange / 2;
    const visibleHalf = halfRange / this.viewport.scale;

    const dataToPixel = (dataX, dataY) => {
      const px = (dataX - this.viewport.offsetX + visibleHalf) / (2 * visibleHalf) * size;
      const py = (this.viewport.offsetY + visibleHalf - dataY) / (2 * visibleHalf) * size;
      return { px, py };
    };

    const { px, py } = dataToPixel(this.userX, this.userY);

    // bardzo duży margines – punkty zawsze widoczne
    if (px < -300 || px > size + 300 || py < -300 || py > size + 300) return;

    const radius = 12; // większy marker

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    const time = Date.now() / 1000;
    const pulse = 1 + 0.12 * Math.sin(time * 1.6);
    const ringRadius = radius * 1.5 * pulse;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.fill();

    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 1;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(px - radius*0.3, py - radius*0.3, 0, px, py, radius);
    grad.addColorStop(0, '#86efac');
    grad.addColorStop(0.7, '#22c55e');
    grad.addColorStop(1, '#15803d');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawOverlays(ctx, size) {
    const halfRange = this.dataRange / 2;
    const visibleHalf = halfRange / this.viewport.scale;

    const dataToPixel = (dataX, dataY) => {
      const px = (dataX - this.viewport.offsetX + visibleHalf) / (2 * visibleHalf) * size;
      const py = (this.viewport.offsetY + visibleHalf - dataY) / (2 * visibleHalf) * size;
      return { px, py };
    };

    const overlaySize = 24; // większe

    for (const overlay of this.overlays) {
      const { px, py } = dataToPixel(overlay.x, overlay.y);

      if (px < -300 || px > size + 300 || py < -300 || py > size + 300) continue;

      const img = this.imageCache[overlay.logoUrl];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.beginPath();
        ctx.arc(px, py, overlaySize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, px - overlaySize/2, py - overlaySize/2, overlaySize, overlaySize);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, overlaySize/2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // fallback
        const bgColor = overlay.type === 'party' ? 'rgba(59, 130, 246, 0.8)' :
                        overlay.type === 'ideology' ? 'rgba(139, 92, 246, 0.8)' :
                        overlay.type === 'user' ? 'rgba(34, 197, 94, 0.8)' :
                        'rgba(100, 100, 100, 0.7)';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, overlaySize/2, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = (overlay.name || '?')[0].toUpperCase();
        ctx.fillText(initial, px, py + 0.5);
      }
    }
  }

  // ===== METODY DLA PANELU KREATYWNEGO =====

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
        this.render();
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
