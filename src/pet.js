import './pet.css';

const CONTROL = 'a[href], button, input, select, textarea, summary, canvas[tabindex], [contenteditable="true"], #chart';
const PREFERENCE = 'earthsona.luma-wandering';
const EDGE = 9;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (from, to) => Math.hypot(to.x - from.x, to.y - from.y);
const transform = ({ x, y }) => `translate(${x}px, ${y}px)`;

function visibleControls(pet) {
  return Array.from(document.querySelectorAll(CONTROL), (element) => pet.contains(element) ? null : element.getBoundingClientRect())
    .filter((rect) => rect?.width && rect.height && rect.bottom > 0 && rect.top < innerHeight);
}

function touchesControl({ x, y }, controls, size) {
  const inset = size.width * 0.14;
  return controls.some(({ left, top, right, bottom }) => (
    x + size.width - inset > left && x + inset < right && y + size.height - 3 > top && y + 7 < bottom
  ));
}

function canTravel(from, to, controls, size) {
  const steps = Math.ceil(distance(from, to) / 12);
  for (let index = 0; index <= steps; index++) {
    const progress = index / steps;
    const waypoint = { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
    if (touchesControl(waypoint, controls, size)) return false;
  }
  return true;
}

function positions(size) {
  const right = Math.max(EDGE, document.documentElement.clientWidth - size.width - EDGE);
  const bottom = Math.max(EDGE, innerHeight - size.height - EDGE);
  const ledges = [1, 0.87, 0.73, 0.59, 0.45];
  return [
    { x: right, y: bottom },
    ...Array.from({ length: 9 }, (_, i) => ({ x: EDGE + (right - EDGE) * i / 9, y: bottom })),
    ...ledges.slice(1).flatMap((height) => [
      { x: EDGE, y: Math.max(EDGE, bottom * height) },
      { x: right, y: Math.max(EDGE, bottom * height) },
    ]),
  ];
}

export function createPet({ onTour }) {
  const pet = document.createElement('aside');
  pet.className = 'roaming-luma';
  pet.setAttribute('aria-label', 'Luma companion');
  pet.innerHTML = `
    <button type="button" class="luma-launcher" aria-label="Meet Luma" aria-expanded="false" aria-controls="luma-greeting"><span class="luma-sprite" aria-hidden="true"></span></button>
    <span class="luma-hello" aria-hidden="true">Hi, I’m Luma!</span>
    <div class="luma-greeting" id="luma-greeting" hidden>
      <div class="luma-greeting-header"><h2>Hi, I’m Luma!</h2><button type="button" aria-label="Close Luma greeting" class="luma-dismiss">×</button></div>
      <p>Come hear a NASA map with me. I’ll show you where the sounds come from.</p>
      <div class="luma-greeting-actions"><button type="button" class="luma-tour-launch">Take the tour</button><button type="button" class="luma-wander" aria-pressed="false">Pause wandering</button></div>
      <small>Luma artwork made with AI assistance</small>
    </div>`;
  document.body.append(pet);

  const launcher = pet.querySelector('.luma-launcher');
  const sprite = pet.querySelector('.luma-sprite');
  const panel = pet.querySelector('.luma-greeting');
  const greeting = pet.querySelector('.luma-hello');
  const wanderButton = pet.querySelector('.luma-wander');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const input = new AbortController();
  const listeners = { signal: input.signal };
  let paused = false;
  let tourActive = false;
  let hovering = false;
  let timer;
  let animation;
  let viewportFrame;
  let position;
  let drag;
  let suppressClick = false;
  let loadedMovement = false;

  try { paused = localStorage.getItem(PREFERENCE) === 'paused'; } catch { /* Current page preferences work without storage. */ }

  function size() {
    return { width: pet.offsetWidth, height: pet.offsetHeight };
  }

  function pose(value) {
    pet.dataset.pose = reducedMotion.matches ? 'idle' : value;
  }

  function updatePanelPosition() {
    const viewport = document.documentElement.clientWidth;
    const { width: spriteWidth, height: spriteHeight } = size();
    const width = Math.min(288, viewport - EDGE * 2);
    const left = clamp(position.x + spriteWidth / 2 - width / 2, EDGE, viewport - EDGE - width);
    const above = position.y - EDGE;
    const below = innerHeight - position.y - spriteHeight - EDGE;
    const panelSide = above >= Math.min(220, below) ? 'above' : 'below';
    pet.style.setProperty('--luma-panel-width', `${width}px`);
    pet.style.setProperty('--luma-panel-left', `${left - position.x}px`);
    pet.style.setProperty('--luma-panel-height', `${Math.max(70, (panelSide === 'above' ? above : below) - 9)}px`);
    pet.dataset.panelSide = panelSide;
    pet.dataset.leftEdge = String(position.x < viewport / 2);
  }

  function place(next) {
    position = next;
    pet.style.transform = transform(next);
    updatePanelPosition();
  }

  function settle() {
    if (!animation) return;
    const { x, y } = pet.getBoundingClientRect();
    animation.cancel();
    animation = undefined;
    pose('idle');
    place({ x, y });
  }

  function stopWandering() {
    clearTimeout(timer);
    settle();
  }

  function schedule(delay = 5500 + Math.random() * 4500) {
    clearTimeout(timer);
    if (paused || reducedMotion.matches || tourActive || hovering || drag || !panel.hidden || !greeting.hidden || document.hidden || pet.contains(document.activeElement)) return;
    timer = setTimeout(wander, delay);
  }

  function wander() {
    const controls = visibleControls(pet);
    const dimensions = size();
    const options = positions(dimensions).filter((point) => {
      const travel = distance(position, point);
      return travel >= 65 && travel <= Math.min(355, innerWidth * 0.82) && canTravel(position, point, controls, dimensions);
    });
    if (!options.length) { schedule(); return; }

    const next = options[Math.floor(Math.random() * options.length)];
    const from = position;
    pose(next.x < from.x ? 'left' : 'right');
    place(next);
    animation = pet.animate([{ transform: transform(from) }, { transform: transform(next) }], {
      duration: clamp(distance(from, next) * 10.5, 850, 3400),
      easing: 'cubic-bezier(.32,.07,.49,.98)',
    });
    animation.onfinish = () => {
      animation = undefined;
      pose('idle');
      schedule();
    };
  }

  function keepClear() {
    if (viewportFrame || tourActive || drag) return;
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = undefined;
      if (tourActive || drag) return;
      stopWandering();
      const dimensions = size();
      const controls = visibleControls(pet);
      const outside = position.x + dimensions.width > document.documentElement.clientWidth
        || position.y + dimensions.height > innerHeight;
      if (outside || (panel.hidden && touchesControl(position, controls, dimensions))) {
        const options = positions(dimensions).filter((point) => !touchesControl(point, controls, dimensions));
        options.sort((a, b) => distance(position, a) - distance(position, b));
        place(options[0] ?? positions(dimensions)[0]);
      } else {
        updatePanelPosition();
      }
      schedule();
    });
  }

  function setGreeting(open, restoreFocus = false) {
    panel.hidden = !open;
    greeting.hidden = true;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      stopWandering();
      updatePanelPosition();
      pose('wave');
    } else {
      pose('idle');
      if (restoreFocus) launcher.focus({ preventScroll: true });
      schedule();
    }
  }

  function updatePreference() {
    wanderButton.hidden = reducedMotion.matches;
    wanderButton.setAttribute('aria-pressed', String(paused));
    wanderButton.textContent = paused ? 'Resume wandering' : 'Pause wandering';
    if (reducedMotion.matches) pose('idle');
    if (paused || reducedMotion.matches) {
      stopWandering();
      return;
    }
    if (!loadedMovement) {
      loadedMovement = true;
      for (const direction of ['left', 'right']) {
        const spriteStrip = new Image();
        spriteStrip.src = `${import.meta.env.BASE_URL}luma/run-${direction}.webp`;
      }
    }
    schedule();
  }

  launcher.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !panel.hidden) return;
    suppressClick = false;
    stopWandering();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: position, moving: false };
    launcher.setPointerCapture(event.pointerId);
  }, listeners);

  launcher.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    if (!drag.moving && Math.hypot(x, y) < 6) return;
    if (!drag.moving) {
      drag.moving = true;
      greeting.hidden = true;
      pet.dataset.dragging = 'true';
    }
    const dimensions = size();
    place({
      x: clamp(drag.origin.x + x, EDGE, Math.max(EDGE, document.documentElement.clientWidth - dimensions.width - EDGE)),
      y: clamp(drag.origin.y + y, EDGE, Math.max(EDGE, innerHeight - dimensions.height - EDGE)),
    });
  }, listeners);

  function release(event) {
    if (drag?.id !== event.pointerId) return;
    suppressClick = drag.moving;
    drag = undefined;
    delete pet.dataset.dragging;
    keepClear();
  }

  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) launcher.addEventListener(type, release, listeners);
  launcher.addEventListener('click', (event) => {
    if (suppressClick && event.detail) return;
    setGreeting(panel.hidden);
  }, listeners);
  sprite.addEventListener('animationend', (event) => {
    if (event.animationName === 'pet-wave' && pet.dataset.pose === 'wave') pose('idle');
  }, listeners);
  pet.querySelector('.luma-dismiss').addEventListener('click', () => setGreeting(false, true), listeners);
  pet.querySelector('.luma-tour-launch').addEventListener('click', () => {
    setGreeting(false);
    onTour(launcher);
  }, listeners);
  wanderButton.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem(PREFERENCE, paused ? 'paused' : 'enabled'); } catch { /* Current page preferences work without storage. */ }
    updatePreference();
  }, listeners);
  pet.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.stopPropagation();
    setGreeting(false, true);
  }, listeners);
  pet.addEventListener('focusin', stopWandering, listeners);
  pet.addEventListener('focusout', () => queueMicrotask(() => schedule()), listeners);
  pet.addEventListener('pointerenter', () => { hovering = true; stopWandering(); }, listeners);
  pet.addEventListener('pointerleave', () => { hovering = false; schedule(); }, listeners);
  document.addEventListener('pointerdown', (event) => {
    if (!panel.hidden && !pet.contains(event.target)) setGreeting(false);
  }, listeners);
  document.addEventListener('focusin', (event) => {
    if (pet.contains(event.target)) return;
    if (!panel.hidden) setGreeting(false);
    keepClear();
  }, listeners);
  document.addEventListener('visibilitychange', () => document.hidden ? stopWandering() : schedule(), listeners);
  window.addEventListener('scroll', keepClear, { ...listeners, passive: true });
  window.addEventListener('resize', keepClear, { ...listeners, passive: true });
  reducedMotion.addEventListener('change', updatePreference, listeners);

  place(positions(size())[0]);
  pose('wave');
  keepClear();
  const helloTimer = setTimeout(() => { greeting.hidden = true; schedule(1600); }, 4300);
  updatePreference();

  return {
    open() { setGreeting(true); launcher.focus({ preventScroll: true }); },
    setTourActive(active) {
      tourActive = active;
      if (active) {
        setGreeting(false);
        stopWandering();
      }
      pet.hidden = active;
      if (!active) keepClear();
    },
    destroy() {
      input.abort();
      clearTimeout(helloTimer);
      cancelAnimationFrame(viewportFrame);
      stopWandering();
      pet.remove();
    },
  };
}
