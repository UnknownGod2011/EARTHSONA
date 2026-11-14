const THEME_KEY = 'earthsona.theme';
const INTRO_KEY = 'earthsona.title-intro';
const SUN = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19m-14 0 1.5-1.5m11-11L19 5"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.3A8.8 8.8 0 0 1 9.7 3.5a8.8 8.8 0 1 0 10.8 10.8Z"/></svg>';

export function initTheme() {
  const button = document.getElementById('theme-toggle');
  if (!button) return;
  let theme = 'light';
  try {
    if (window.localStorage.getItem(THEME_KEY) === 'dark') theme = 'dark';
  } catch {
    // Theme remains usable for the current page when storage is disabled.
  }

  function apply() {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0c0e19' : '#f6f5f0');
    button.setAttribute('aria-pressed', String(dark));
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    button.innerHTML = dark ? SUN : MOON;
  }

  button.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    apply();
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The selected theme is already active.
    }
  });
  apply();
}

function firstVisit() {
  try {
    if (window.localStorage.getItem(INTRO_KEY)) return false;
    window.localStorage.setItem(INTRO_KEY, 'shown');
  } catch {
    // Restricted storage can only limit the reveal to once per page load.
  }
  return true;
}

function titlePixels(text, width, height, padding) {
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const context = mask.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  const parentRect = text.parentElement.getBoundingClientRect();
  const range = document.createRange();
  const runs = [...text.childNodes].filter((node) => node.textContent.trim());

  runs.forEach((run) => {
    range.selectNodeContents(run);
    const rectangle = range.getBoundingClientRect();
    const style = getComputedStyle(run.nodeType === Node.ELEMENT_NODE ? run : text);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    const metrics = context.measureText(run.textContent);
    const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.2;
    const baseline = (rectangle.height + ascent - descent) / 2;
    context.fillStyle = run.nodeType === Node.ELEMENT_NODE ? '#f00000' : '#000000';
    context.fillText(run.textContent, rectangle.x - parentRect.x + padding, rectangle.y - parentRect.y + padding + baseline);
  });

  const rgba = context.getImageData(0, 0, width, height).data;
  const points = [];
  const spacing = width > 500 ? 4 : 3;
  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      const offset = (y * width + x) * 4;
      if (rgba[offset + 3] < 140) continue;
      points.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 120,
        dy: 24 + (Math.random() - 0.5) * 87,
        size: 0.9 + Math.random() * 1.45,
        lag: Math.random() * 0.38,
        accent: rgba[offset] > 120,
      });
    }
  }
  return points;
}

export async function initTitleReveal() {
  const title = document.getElementById('hero-title');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!title || reduce.matches || document.hidden || location.hash || !firstVisit()) return;

  const text = document.createElement('span');
  text.className = 'title-reveal-text';
  text.append(...title.childNodes);
  title.append(text);
  const duration = 1240;
  const padding = 16;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.className = 'title-particles';
  canvas.setAttribute('aria-hidden', 'true');
  title.append(canvas);
  text.style.opacity = '0.22';

  let frame;
  let cancelled = false;
  function finish() {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(frame);
    canvas.remove();
    text.replaceWith(...text.childNodes);
    document.removeEventListener('visibilitychange', finish);
    window.removeEventListener('resize', finish);
    reduce.removeEventListener('change', finish);
  }

  document.addEventListener('visibilitychange', finish);
  window.addEventListener('resize', finish);
  reduce.addEventListener('change', finish);

  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 220))]);
  if (cancelled) return;
  const width = Math.ceil(title.getBoundingClientRect().width) + padding * 2;
  const height = Math.ceil(title.getBoundingClientRect().height) + padding * 2;
  const particles = titlePixels(text, width, height, padding);
  if (!particles.length) {
    finish();
    return;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);
  const colors = getComputedStyle(title);
  const ink = colors.getPropertyValue('--ink').trim();
  const accent = colors.getPropertyValue('--purple').trim();
  let start;

  function draw(now) {
    start ??= now;
    const progress = Math.min(1, (now - start) / duration);
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const phase = Math.max(0, Math.min(1, (progress - particle.lag) / 0.57));
      if (phase <= 0) continue;
      const distance = (1 - phase) ** 3;
      const fade = 1 - Math.max(0, (progress - 0.55) / 0.45);
      context.globalAlpha = Math.min(1, phase * 2.8) * fade * 0.86;
      context.fillStyle = particle.accent ? accent : ink;
      context.fillRect(particle.x + particle.dx * distance, particle.y + particle.dy * distance, particle.size, particle.size);
    }
    const reveal = Math.max(0, Math.min(1, (progress - 0.43) / 0.47));
    text.style.opacity = (0.22 + 0.78 * reveal).toFixed(3);
    if (progress < 1) frame = requestAnimationFrame(draw);
    else finish();
  }

  frame = requestAnimationFrame(draw);
}
