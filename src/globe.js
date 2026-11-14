export const ANOMALY_SCALE = Object.freeze({
  limit: 3,
  cold: '#8da9ff',
  neutral: '#d0d7dc',
  warm: '#ff856a',
  missing: '#77788a',
});

const TEXTURE_URL = `${import.meta.env.BASE_URL}earth/blue-marble-july-2004.webp`;
const RADIANS = Math.PI / 180;
const INVERSE_TURN = 1 / (2 * Math.PI);
const DEFAULT_LONGITUDE = -24;
const DEFAULT_LATITUDE = 24;
const LATITUDE_STEPS = 2048;
const rgb = (color) => color.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16));
const COLD = rgb(ANOMALY_SCALE.cold);
const NEUTRAL = rgb(ANOMALY_SCALE.neutral);
const WARM = rgb(ANOMALY_SCALE.warm);
const MISSING = rgb(ANOMALY_SCALE.missing);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function bandTint(anomaly) {
  if (!Number.isFinite(anomaly)) return [...MISSING, 0.33];

  const strength = Math.min(1, Math.abs(anomaly) / ANOMALY_SCALE.limit);
  const end = anomaly < 0 ? COLD : WARM;
  const channels = NEUTRAL.map((channel, index) => channel + strength * (end[index] - channel));
  return [...channels, 0.13 + 0.43 * strength];
}

async function readTexture() {
  const image = new Image();
  image.src = TEXTURE_URL;

  try {
    await image.decode();
    const source = document.createElement('canvas');
    source.width = image.naturalWidth;
    source.height = image.naturalHeight;
    const context = source.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, source.width, source.height);
  } catch {
    return null;
  }
}

function createSurface(width, height, zoom, context) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.45 * zoom;
  const sphere = context.createImageData(width, height);
  const rayDepth = new Float32Array(width * height);
  const surfaceLight = new Float32Array(width * height);
  const alpha = new Uint8ClampedArray(width * height);

  for (let y = 0; y < height; y++) {
    const worldY = (centerY - y - 0.5) / radius;

    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const worldX = (x + 0.5 - centerX) / radius;
      const distanceSquared = worldX * worldX + worldY * worldY;
      if (distanceSquared > 1) continue;

      const depth = Math.sqrt(1 - distanceSquared);
      const light = Math.max(0, -0.51 * worldX + 0.55 * worldY + 0.66 * depth);
      rayDepth[index] = depth;
      surfaceLight[index] = 0.32 + 0.77 * light;
      alpha[index] = 255 * Math.min(1, (1 - Math.sqrt(distanceSquared)) * radius + 0.45);
    }
  }

  return { width, height, centerX, centerY, radius, sphere, rayDepth, surfaceLight, alpha };
}

export function createGlobe(canvas, { onSelect, onHover, overlay = true } = {}) {
  const context = canvas.getContext('2d');
  if (!context) {
    return {
      ready: Promise.resolve(false),
      setBands() {}, setOverlay() {}, focusBand() {}, zoomBy() {}, reset() {}, destroy() {},
    };
  }

  const abort = new AbortController();
  const listeners = { signal: abort.signal };
  const pointers = new Map();
  const bandTints = new Array(LATITUDE_STEPS);
  let bands = [];
  let texture = null;
  let surface = null;
  let frame = 0;
  let longitude = DEFAULT_LONGITUDE;
  let latitude = DEFAULT_LATITUDE;
  let zoom = 1;
  let hover = null;
  let dragged = false;

  if (!canvas.hasAttribute('tabindex')) canvas.tabIndex = 0;
  if (!canvas.hasAttribute('aria-label')) {
    canvas.setAttribute('aria-label', 'Interactive Earth globe. Arrow keys rotate, plus and minus zoom, Enter selects the centered band, and Home resets the view.');
  }
  if (getComputedStyle(canvas).touchAction === 'auto') canvas.style.touchAction = 'none';
  canvas.style.cursor = 'grab';

  function invalidate() {
    if (frame || abort.signal.aborted) return;
    frame = requestAnimationFrame(render);
  }

  function getGeometry() {
    const bounds = canvas.getBoundingClientRect();
    const maxEdge = Math.max(bounds.width, bounds.height);
    if (maxEdge === 0 || bounds.width === 0 || bounds.height === 0) return null;

    const scale = Math.min(window.devicePixelRatio || 1, 1.6, 1100 / maxEdge);
    const width = Math.max(1, Math.round(bounds.width * scale));
    const height = Math.max(1, Math.round(bounds.height * scale));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    if (!surface || surface.width !== width || surface.height !== height) {
      surface = createSurface(width, height, zoom, context);
    }

    return surface;
  }

  function paintSurface(geometry, cosLatitude, sinLatitude) {
    const { width, height, centerX, centerY, radius, sphere, rayDepth, surfaceLight, alpha } = geometry;
    const spin = longitude / 360 + 0.5;
    const output = sphere.data;

    for (let y = 0; y < height; y++) {
      const north = (centerY - y - 0.5) / radius;

      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (alpha[index] === 0) continue;

        const east = (x + 0.5 - centerX) / radius;
        const depth = rayDepth[index];
        const sine = clamp(north * cosLatitude + depth * sinLatitude, -1, 1);
        const meridian = depth * cosLatitude - north * sinLatitude;
        const v = 0.5 - Math.asin(sine) / Math.PI;
        let red = 21;
        let green = 35;
        let blue = 51;

        if (texture) {
          const u = spin + Math.atan2(east, meridian) * INVERSE_TURN;
          const sourceX = Math.floor((u - Math.floor(u)) * texture.width);
          const sourceY = Math.min(texture.height - 1, Math.floor(v * texture.height));
          const source = (sourceY * texture.width + sourceX) * 4;
          red = texture.data[source];
          green = texture.data[source + 1];
          blue = texture.data[source + 2];
        }

        const tint = overlay && bandTints[Math.min(LATITUDE_STEPS - 1, Math.floor(v * LATITUDE_STEPS))];
        if (tint) {
          const strength = tint[4] && (x + y) % 8 < 2 ? tint[3] * 0.5 : tint[3];
          red += (tint[0] - red) * strength;
          green += (tint[1] - green) * strength;
          blue += (tint[2] - blue) * strength;
        }

        const light = surfaceLight[index];
        const rim = (1 - depth) ** 5;
        const pixel = index * 4;
        output[pixel] = red * light + 14 * rim;
        output[pixel + 1] = green * light + 36 * rim;
        output[pixel + 2] = blue * light + 61 * rim;
        output[pixel + 3] = alpha[index];
      }
    }

    context.putImageData(sphere, 0, 0);
  }

  function drawAtmosphere({ centerX, centerY, radius }) {
    const start = Math.max(0, radius - 2);
    const glow = context.createRadialGradient(centerX, centerY, start, centerX, centerY, radius * 1.11);
    glow.addColorStop(0, 'rgba(99, 187, 240, 0.54)');
    glow.addColorStop(0.13, 'rgba(61, 137, 210, 0.24)');
    glow.addColorStop(1, 'rgba(40, 89, 160, 0)');
    context.save();
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = glow;
    context.beginPath();
    context.arc(centerX, centerY, radius * 1.11, 0, 2 * Math.PI);
    context.fill();
    context.restore();
  }

  function drawGrid(geometry, cosLatitude, sinLatitude) {
    const { centerX, centerY, radius } = geometry;

    function trace(curve, style, weight, dashes = []) {
      context.beginPath();
      context.setLineDash(dashes);
      context.lineWidth = weight;
      context.strokeStyle = style;
      let previousVisible = false;

      for (let point = 0; point <= 180; point++) {
        const [east, north, depth] = curve(point / 180);
        const projectedY = north * cosLatitude - depth * sinLatitude;
        const visible = north * sinLatitude + depth * cosLatitude >= 0;

        if (visible) {
          const x = centerX + east * radius;
          const y = centerY - projectedY * radius;
          if (previousVisible) context.lineTo(x, y);
          else context.moveTo(x, y);
        }
        previousVisible = visible;
      }

      context.stroke();
    }

    function parallel(angle, style, weight, dashes) {
      if (Math.abs(angle) >= 90) return;
      const sine = Math.sin(angle * RADIANS);
      const cosine = Math.cos(angle * RADIANS);
      trace((t) => {
        const rotation = 2 * Math.PI * (t - 0.5);
        return [cosine * Math.sin(rotation), sine, cosine * Math.cos(rotation)];
      }, style, weight, dashes);
    }

    context.save();
    const weight = Math.max(1, radius / 260);

    for (let angle = -180; angle < 180; angle += 30) {
      const rotation = (angle - longitude) * RADIANS;
      const sine = Math.sin(rotation);
      const cosine = Math.cos(rotation);
      trace((t) => {
        const phase = Math.PI * (t - 0.5);
        const scale = Math.cos(phase);
        return [scale * sine, Math.sin(phase), scale * cosine];
      }, 'rgba(172, 223, 244, 0.16)', weight);
    }

    const edges = new Set(bands.flatMap((band) => [band.south, band.north]));
    for (const edge of edges) {
      parallel(edge, 'rgba(192, 218, 235, 0.29)', weight);
    }

    const colors = { primary: '#ffe2a1', comparison: '#6eecdf' };
    for (const band of bands) {
      const hovered = band.id === hover;
      if (!band.role && !hovered) continue;
      const color = colors[band.role] ?? 'rgba(238, 248, 255, 0.68)';
      const dashes = band.role === 'comparison' ? [4 * weight, 4 * weight] : [];
      parallel(band.south, color, weight * 1.7, dashes);
      parallel(band.north, color, weight * 1.7, dashes);
    }

    context.restore();
  }

  function render() {
    frame = 0;
    const geometry = getGeometry();
    if (!geometry) return;

    const lat = latitude * RADIANS;
    paintSurface(geometry, Math.cos(lat), Math.sin(lat));
    drawAtmosphere(geometry);
    drawGrid(geometry, Math.cos(lat), Math.sin(lat));
  }

  function setBands(nextBands) {
    bands = nextBands.filter((band) => band.south < band.north && band.south >= -90 && band.north <= 90);
    bandTints.fill(undefined);

    for (const band of bands) {
      const tint = [...bandTint(band.anomaly), !Number.isFinite(band.anomaly)];
      const start = Math.round((90 - band.north) / 180 * LATITUDE_STEPS);
      const end = Math.round((90 - band.south) / 180 * LATITUDE_STEPS);
      bandTints.fill(tint, start, end);
    }

    invalidate();
  }

  function bandAtLatitude(angle) {
    return bands.find((band) => angle >= band.south && (angle < band.north || band.north === 90))?.id ?? null;
  }

  function bandAtPointer(event) {
    const bounds = canvas.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) * 0.45 * zoom;
    if (radius === 0) return null;
    const east = (event.clientX - bounds.left - bounds.width / 2) / radius;
    const north = (bounds.top + bounds.height / 2 - event.clientY) / radius;
    const distance = east * east + north * north;
    if (distance > 1) return null;

    const lat = latitude * RADIANS;
    const sine = north * Math.cos(lat) + Math.sqrt(1 - distance) * Math.sin(lat);
    return bandAtLatitude(Math.asin(clamp(sine, -1, 1)) / RADIANS);
  }

  function updateHover(id) {
    canvas.style.cursor = id ? 'pointer' : 'grab';
    if (id === hover) return;
    hover = id;
    onHover?.(id);
    invalidate();
  }

  function rotateBy(horizontal, vertical) {
    longitude = (longitude + horizontal + 540) % 360 - 180;
    latitude = clamp(latitude + vertical, -88, 88);
    invalidate();
  }

  function setZoom(value) {
    const next = clamp(value, 0.68, 2.4);
    if (!Number.isFinite(next) || zoom === next) return;
    zoom = next;
    surface = null;
    invalidate();
  }

  function reset() {
    longitude = DEFAULT_LONGITUDE;
    latitude = DEFAULT_LATITUDE;
    setZoom(1);
    invalidate();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (pointers.size === 0) dragged = false;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size > 1) dragged = true;
    canvas.setPointerCapture(event.pointerId);
  }, listeners);

  canvas.addEventListener('pointermove', (event) => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) {
      if (event.pointerType === 'mouse') updateHover(bandAtPointer(event));
      return;
    }

    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!dragged && Math.hypot(dx, dy) < 4) return;
    dragged = true;
    updateHover(null);
    canvas.style.cursor = 'grabbing';

    if (pointers.size === 1) {
      rotateBy(-dx * 0.43 / zoom, dy * 0.43 / zoom);
    } else if (pointers.size === 2) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
      const initialDistance = Math.hypot(pointer.x - other.x, pointer.y - other.y);
      const currentDistance = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      if (initialDistance > 0) setZoom(zoom * currentDistance / initialDistance);
    }

    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, listeners);

  function finishPointer(event) {
    if (!pointers.delete(event.pointerId)) return;
    if (pointers.size > 0) return;
    canvas.style.cursor = 'grab';
    if (event.type !== 'pointerup') return;

    const id = bandAtPointer(event);
    if (event.pointerType === 'mouse') updateHover(id);
    if (id && !dragged) onSelect?.(id);
  }

  canvas.addEventListener('pointerup', finishPointer, listeners);
  canvas.addEventListener('pointercancel', finishPointer, listeners);
  canvas.addEventListener('lostpointercapture', finishPointer, listeners);
  canvas.addEventListener('pointerleave', () => updateHover(null), listeners);
  canvas.addEventListener('wheel', (event) => {
    if (document.activeElement !== canvas || event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoom * Math.exp(-event.deltaY * 0.0015));
  }, { ...listeners, passive: false });

  canvas.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft': rotateBy(-10, 0); break;
      case 'ArrowRight': rotateBy(10, 0); break;
      case 'ArrowUp': rotateBy(0, 8); break;
      case 'ArrowDown': rotateBy(0, -8); break;
      case '+':
      case '=': setZoom(zoom * 1.15); break;
      case '-': setZoom(zoom / 1.15); break;
      case 'Home': reset(); break;
      case 'Enter': {
        const id = bandAtLatitude(latitude);
        if (id) onSelect?.(id);
        break;
      }
      default: return;
    }
    event.preventDefault();
  }, listeners);

  const observer = new ResizeObserver(invalidate);
  observer.observe(canvas);
  invalidate();
  const ready = readTexture().then((result) => {
    texture = result;
    invalidate();
    return Boolean(texture);
  });

  return {
    ready,
    setBands,
    setOverlay(enabled) {
      overlay = enabled;
      invalidate();
    },
    focusBand(id) {
      const band = bands.find((entry) => entry.id === id);
      if (!band) return;
      latitude = (band.south + band.north) / 2;
      invalidate();
    },
    zoomBy(factor) {
      setZoom(zoom * factor);
    },
    reset,
    destroy() {
      abort.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
    },
  };
}
