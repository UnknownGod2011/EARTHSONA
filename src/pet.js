import './pet.css';

const CONTROL = 'a[href], button, input, select, textarea, summary, canvas[tabindex], [contenteditable="true"]';
const PREFERENCE = 'earthsona.luma-wandering';
const EDGE = 8;
const PET_SIZE = 46;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function visibleControls(pet) {
  return Array.from(document.querySelectorAll(CONTROL), (element) => pet.contains(element) ? null : element.getBoundingClientRect())
    .filter((rect) => rect?.width && rect.height && rect.bottom > 0 && rect.top < innerHeight);
}

function touchesControl({ x, y }, controls) {
  return controls.some(({ left, top, right, bottom }) => (
    x + PET_SIZE + 5 > left && x - 5 < right && y + PET_SIZE + 5 > top && y - 5 < bottom
  ));
}

function canTravel(from, to, controls) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.ceil(length / 12);
  for (let index = 0; index <= steps; index++) {
    const progress = index / steps;
    const waypoint = { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
    if (touchesControl(waypoint, controls)) return false;
  }
  return true;
}

function candidates() {
  const right = document.documentElement.clientWidth - PET_SIZE - EDGE;
  const bottom = innerHeight - PET_SIZE - EDGE;
  const heights = [1, .89, .78, .66, .54, .42, .30, .18];
  return [
    ...heights.map((height) => ({ x: right, y: Math.max(EDGE, bottom * height) })),
    ...heights.map((height) => ({ x: EDGE, y: Math.max(EDGE, bottom * height) })),
    ...[.83, .66, .49, .33, .16].map((width) => ({ x: right * width, y: bottom })),
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
      <p>Want a tour? I’ll show you how to hear a NASA map and follow the data behind each note.</p>
      <div class="luma-greeting-actions"><button type="button" class="luma-tour-launch">Take the tour</button><button type="button" class="luma-wander" aria-pressed="false">Pause wandering</button></div>
      <small>Luma artwork made with AI assistance</small>
    </div>`;
  document.body.append(pet);

  const launcher = pet.querySelector('.luma-launcher');
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

  try { paused = localStorage.getItem(PREFERENCE) === 'paused'; } catch { /* Storage can be disabled. */ }

  function updatePanelPosition() {
    const viewport = document.documentElement.clientWidth;
    const width = Math.min(270, viewport - EDGE * 2);
    const left = clamp(position.x + PET_SIZE / 2 - width / 2, EDGE, viewport - EDGE - width);
    pet.style.setProperty('--luma-panel-width', `${width}px`);
    pet.style.setProperty('--luma-panel-left', `${left - position.x}px`);
    const above = position.y - EDGE;
    const below = innerHeight - position.y - PET_SIZE - EDGE;
    const panelSide = above >= Math.min(220, below) ? 'above' : 'below';
    pet.style.setProperty('--luma-panel-height', `${Math.max(70, (panelSide === 'above' ? above : below) - 9)}px`);
    pet.dataset.panelSide = panelSide;
    pet.dataset.leftEdge = String(position.x < viewport / 2);
  }

  function place(next) {
    position = next;
    pet.style.transform = `translate(${next.x}px, ${next.y}px)`;
    updatePanelPosition();
  }

  function settle() {
    if (!animation) return;
    const { x, y } = pet.getBoundingClientRect();
    animation.cancel();
    animation = undefined;
    pet.dataset.walking = 'false';
    place({ x, y });
  }

  function stopWandering() {
    clearTimeout(timer);
    settle();
  }

  function schedule(delay = 4300 + Math.random() * 3500) {
    clearTimeout(timer);
    if (paused || reducedMotion.matches || tourActive || hovering || !panel.hidden || !greeting.hidden || document.hidden || pet.contains(document.activeElement)) return;
    timer = setTimeout(wander, delay);
  }

  function wander() {
    const controls = visibleControls(pet);
    const options = candidates().filter((point) => {
      const distance = Math.hypot(position.x - point.x, position.y - point.y);
      return distance >= 38 && distance <= Math.min(340, innerWidth * .65) && canTravel(position, point, controls);
    });
    if (!options.length) { schedule(); return; }

    const next = options[Math.floor(Math.random() * options.length)];
    const from = pet.style.transform;
    const distance = Math.hypot(position.x - next.x, position.y - next.y);
    pet.dataset.walking = 'true';
    place(next);
    animation = pet.animate([{ transform: from }, { transform: pet.style.transform }], {
      duration: clamp(distance * 13, 850, 3600),
      easing: 'cubic-bezier(.33,.07,.24,.97)',
    });
    animation.onfinish = () => {
      animation = undefined;
      pet.dataset.walking = 'false';
      schedule();
    };
  }

  function keepClear() {
    if (viewportFrame || tourActive) return;
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = undefined;
      stopWandering();
      const viewport = document.documentElement.clientWidth;
      const controls = visibleControls(pet);
      const outside = position.x > viewport - PET_SIZE || position.y > innerHeight - PET_SIZE;
      if (outside || (panel.hidden && !pet.contains(document.activeElement) && touchesControl(position, controls))) {
        const options = candidates().filter((point) => !touchesControl(point, controls));
        options.sort((a, b) => Math.hypot(a.x - position.x, a.y - position.y) - Math.hypot(b.x - position.x, b.y - position.y));
        place(options[0] || candidates()[0]);
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
    } else {
      if (restoreFocus) launcher.focus({ preventScroll: true });
      schedule();
    }
  }

  function updatePreference() {
    wanderButton.hidden = reducedMotion.matches;
    wanderButton.setAttribute('aria-pressed', String(paused));
    wanderButton.textContent = paused ? 'Resume wandering' : 'Pause wandering';
    pet.dataset.still = String(paused || reducedMotion.matches);
    if (paused || reducedMotion.matches) stopWandering();
    else schedule();
  }

  launcher.addEventListener('click', () => setGreeting(panel.hidden), listeners);
  pet.querySelector('.luma-dismiss').addEventListener('click', () => setGreeting(false, true), listeners);
  pet.querySelector('.luma-tour-launch').addEventListener('click', () => {
    setGreeting(false);
    onTour(launcher);
  }, listeners);
  wanderButton.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem(PREFERENCE, paused ? 'paused' : 'enabled'); } catch { /* Current-page preference still applies. */ }
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

  const home = candidates()[0];
  place(home);
  keepClear();
  const helloTimer = setTimeout(() => { greeting.hidden = true; schedule(900); }, 4000);
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
