const THEME_KEY = 'earthsona.theme';
const LETTER_DELAY = 270;
const LETTER_SETTLE = 820;
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

function titlePixels(text, width, height, padding) {
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const context = mask.getContext('2d', { willReadFrequently: true });
  if (!context) return { particles: [], letters: [] };
  const parentRect = text.getBoundingClientRect();
  const range = document.createRange();
  const runs = [...text.childNodes].filter((node) => node.textContent.trim());
  const letters = [];

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
    const node = run.nodeType === Node.TEXT_NODE ? run : run.firstChild;
    for (let index = 0; index < node.length; index++) {
      if (/\s/.test(node.textContent[index])) continue;
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const glyph = range.getBoundingClientRect();
      letters.push({ center: glyph.left + glyph.width / 2 - parentRect.left, right: glyph.right - parentRect.left });
    }
  });

  const rgba = context.getImageData(0, 0, width, height).data;
  const particles = [];
  const spacing = width > 500 ? 4 : 3;
  for (let y = 0; y < height; y += spacing) {
    let letter = 0;
    for (let x = 0; x < width; x += spacing) {
      while (letter + 1 < letters.length && x - padding > (letters[letter].center + letters[letter + 1].center) / 2) letter++;
      const offset = (y * width + x) * 4;
      if (rgba[offset + 3] < 140) continue;
      particles.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 56,
        dy: 10 + (Math.random() - 0.5) * 43,
        size: 1 + Math.random() * 1.3,
        start: letter * LETTER_DELAY + Math.random() * 120,
        accent: rgba[offset] > 120,
      });
    }
  }
  return { particles, letters };
}

export async function initTitleReveal() {
  const title = document.getElementById('hero-title');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!title || reduce.matches || document.hidden || (location.hash && location.hash !== '#top')) return;

  const text = document.createElement('span');
  text.className = 'title-reveal-text';
  text.append(...title.childNodes);
  title.append(text);
  const padding = 32;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  canvas.className = 'title-particles';
  canvas.setAttribute('aria-hidden', 'true');
  title.append(canvas);
  text.style.maskImage = 'linear-gradient(to right, #0003, #0003)';

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
  const bounds = text.getBoundingClientRect();
  const rightPadding = Math.max(0, Math.min(padding, document.documentElement.clientWidth - Math.ceil(bounds.right)));
  const width = Math.ceil(bounds.width) + padding + rightPadding;
  const height = Math.ceil(bounds.height) + padding * 2;
  const { particles, letters } = titlePixels(text, width, height, padding);
  if (!particles.length || !letters.length) {
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
  const duration = (letters.length - 1) * LETTER_DELAY + LETTER_SETTLE + 160;
  let start;

  function draw(now) {
    start ??= now;
    const elapsed = now - start;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const phase = (elapsed - particle.start) / LETTER_SETTLE;
      if (phase <= 0 || phase >= 1) continue;
      const distance = (1 - phase) ** 2;
      context.globalAlpha = Math.min(1, phase * 5, (1 - phase) * 3.6) * 0.94;
      context.fillStyle = particle.accent ? accent : ink;
      context.fillRect(particle.x + particle.dx * distance, particle.y + particle.dy * distance, particle.size, particle.size);
    }
    const revealed = Math.max(0, (elapsed - 430) / LETTER_DELAY);
    const letterIndex = Math.min(letters.length - 1, Math.floor(revealed));
    const left = letters[letterIndex - 1]?.right ?? 0;
    const right = letters[letterIndex].right;
    const edge = Math.max(0, left + (right - left) * Math.min(1, revealed - letterIndex));
    text.style.maskImage = `linear-gradient(to right, #000 ${edge}px, #0003 ${edge + 8}px)`;
    if (elapsed < duration) frame = requestAnimationFrame(draw);
    else finish();
  }

  frame = requestAnimationFrame(draw);
}
