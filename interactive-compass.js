// interactive-compass.js
class InteractiveCompass {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    // Współrzędne użytkownika (domyślnie 0,0)
    this.userX = 0;
    this.userY = 0;
    // Nakładki: tablica obiektów { imageUrl, x, y, type, name, description }
    this.overlays = [];
    // Skala i przesunięcie
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    // Etykiety osi
    this.labels = {
      top: options.labels?.top || 'Heteronomia',
      bottom: options.labels?.bottom || 'Autonomia',
      left: options.labels?.left || 'Socjalizm',
      right: options.labels?.right || 'Kapitalizm'
    };
    // Obsługa przeciągania
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragStartOffsetX = 0;
    this.dragStartOffsetY = 0;
    // Inicjalizacja canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.backgroundColor = '#fff';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    // Rozmiar logiczny canvas
    this.resizeCanvas();
    // Event listenery
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    // Touch
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    // Pierwsze rysowanie
    this.draw();
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.draw();
  }

  toPixelX(x) {
    const range = 20;
    const centerX = this.width / 2;
    const pixelPerUnit = (this.width / range) * this.scale;
    return centerX + (x * pixelPerUnit) + this.offsetX;
  }

  toPixelY(y) {
    const range = 20;
    const centerY = this.height / 2;
    const pixelPerUnit = (this.height / range) * this.scale;
    return centerY - (y * pixelPerUnit) + this.offsetY;
  }

  toLogicalX(px) {
    const range = 20;
    const centerX = this.width / 2;
    const pixelPerUnit = (this.width / range) * this.scale;
    return (px - centerX - this.offsetX) / pixelPerUnit;
  }

  toLogicalY(py) {
    const range = 20;
    const centerY = this.height / 2;
    const pixelPerUnit = (this.height / range) * this.scale;
    return (centerY - py + this.offsetY) / pixelPerUnit;
  }

  zoom(factor, px, py) {
    const oldScale = this.scale;
    const newScale = Math.min(Math.max(this.scale * factor, 0.1), 10);
    if (newScale === oldScale) return;
    const oldPixelPerUnitX = (this.width / 20) * oldScale;
    const oldPixelPerUnitY = (this.height / 20) * oldScale;
    const newPixelPerUnitX = (this.width / 20) * newScale;
    const newPixelPerUnitY = (this.height / 20) * newScale;
    const xLog = this.toLogicalX(px);
    const yLog = this.toLogicalY(py);
    this.offsetX += xLog * (oldPixelPerUnitX - newPixelPerUnitX);
    this.offsetY -= yLog * (oldPixelPerUnitY - newPixelPerUnitY);
    this.scale = newScale;
    this.draw();
  }

  pan(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.draw();
  }

  updateUserMarker(x, y) {
    this.userX = x;
    this.userY = y;
    this.draw();
  }

  addOverlay(imageUrl, x, y, type, name, description) {
    this.overlays.push({ imageUrl, x, y, type, name, description });
    this.draw();
  }

  clearOverlays() {
    this.overlays = [];
    this.draw();
  }

  updateLabels(labels) {
    if (labels.top) this.labels.top = labels.top;
    if (labels.bottom) this.labels.bottom = labels.bottom;
    if (labels.left) this.labels.left = labels.left;
    if (labels.right) this.labels.right = labels.right;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    // Tło – kwadranty
    const quadrants = [
      { x1: -10, y1: 0, x2: 0, y2: 10, color: '#DD0000' },
      { x1: 0, y1: 0, x2: 10, y2: 10, color: '#0183be' },
      { x1: -10, y1: -10, x2: 0, y2: 0, color: '#101010' },
      { x1: 0, y1: -10, x2: 10, y2: 0, color: '#F4DC00' }
    ];
    for (const q of quadrants) {
      const px1 = this.toPixelX(q.x1);
      const px2 = this.toPixelX(q.x2);
      const py1 = this.toPixelY(q.y1);
      const py2 = this.toPixelY(q.y2);
      const left = Math.min(px1, px2);
      const right = Math.max(px1, px2);
      const top = Math.min(py1, py2);
      const bottom = Math.max(py1, py2);
      if (right < 0 || left > w || bottom < 0 || top > h) continue;
      ctx.fillStyle = q.color;
      ctx.fillRect(left, top, right - left, bottom - top);
    }

    // Siatka i osie
    this.drawGrid(ctx, w, h);

    // Oś X i Y
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    const xAxisY = this.toPixelY(0);
    if (xAxisY >= 0 && xAxisY <= h) {
      ctx.beginPath();
      ctx.moveTo(0, xAxisY);
      ctx.lineTo(w, xAxisY);
      ctx.stroke();
    }
    const yAxisX = this.toPixelX(0);
    if (yAxisX >= 0 && yAxisX <= w) {
      ctx.beginPath();
      ctx.moveTo(yAxisX, 0);
      ctx.lineTo(yAxisX, h);
      ctx.stroke();
    }

    // Nakładki (placeholdery – potem można dodać wczytywanie obrazków)
    for (const overlay of this.overlays) {
      const px = this.toPixelX(overlay.x);
      const py = this.toPixelY(overlay.y);
      if (px < -20 || px > w+20 || py < -20 || py > h+20) continue;
      const size = 24;
      ctx.fillStyle = '#aaa';
      ctx.fillRect(px - size/2, py - size/2, size, size);
      ctx.beginPath();
      ctx.arc(px, py, size/2, 0, 2*Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
    }

    // Marker użytkownika
    const userPx = this.toPixelX(this.userX);
    const userPy = this.toPixelY(this.userY);
    if (userPx >= -20 && userPx <= w+20 && userPy >= -20 && userPy <= h+20) {
      const radius = 8;
      ctx.beginPath();
      ctx.arc(userPx, userPy, radius, 0, 2*Math.PI);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawGrid(ctx, w, h) {
    const xMin = this.toLogicalX(0);
    const xMax = this.toLogicalX(w);
    const yMin = this.toLogicalY(h);
    const yMax = this.toLogicalY(0);
    const rangeX = Math.abs(xMax - xMin);
    const rangeY = Math.abs(yMax - yMin);
    const targetLines = 10;
    let stepX = rangeX / targetLines;
    let stepY = rangeY / targetLines;
    stepX = this.niceStep(stepX);
    stepY = this.niceStep(stepY);

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    ctx.fillStyle = '#333';
    ctx.font = '10px sans-serif';

    // Pionowe
    let startX = Math.ceil(xMin / stepX) * stepX;
    for (let x = startX; x <= xMax; x += stepX) {
      const px = this.toPixelX(x);
      if (px < 0 || px > w) continue;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(x.toFixed(this.decimalPlaces(stepX)), px, 2);
    }

    // Poziome
    let startY = Math.ceil(yMin / stepY) * stepY;
    for (let y = startY; y <= yMax; y += stepY) {
      const py = this.toPixelY(y);
      if (py < 0 || py > h) continue;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(y.toFixed(this.decimalPlaces(stepY)), 2, py);
    }

    // Etykiety osi
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.labels.top, w/2, 10);
    ctx.textBaseline = 'top';
    ctx.fillText(this.labels.bottom, w/2, h-10);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.labels.left, 10, h/2);
    ctx.textAlign = 'right';
    ctx.fillText(this.labels.right, w-10, h/2);
  }

  niceStep(step) {
    const exponent = Math.floor(Math.log10(step));
    const fraction = step / Math.pow(10, exponent);
    let niceFraction;
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * Math.pow(10, exponent);
  }

  decimalPlaces(step) {
    const s = String(step);
    const dot = s.indexOf('.');
    if (dot === -1) return 0;
    return s.length - dot - 1;
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(delta, px, py);
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartOffsetX = this.offsetX;
    this.dragStartOffsetY = this.offsetY;
    this.canvas.style.cursor = 'grabbing';
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    this.pan(dx, dy);
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartOffsetX = this.offsetX;
    this.dragStartOffsetY = this.offsetY;
  }

  onMouseUp(e) {
    this.isDragging = false;
    this.canvas.style.cursor = 'default';
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    this.isDragging = true;
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.dragStartOffsetX = this.offsetX;
    this.dragStartOffsetY = this.offsetY;
  }

  onTouchMove(e) {
    e.preventDefault();
    if (!this.isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - this.dragStartX;
    const dy = touch.clientY - this.dragStartY;
    this.pan(dx, dy);
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.dragStartOffsetX = this.offsetX;
    this.dragStartOffsetY = this.offsetY;
  }

  onTouchEnd(e) {
    this.isDragging = false;
  }
}
