import './pet.css';

const CONTROL = 'a[href], button, input, select, textarea, summary, canvas[tabindex], [contenteditable="true"], #chart, #hero-title em';
const PREFERENCE = 'earthsona.luma-wandering';
const EDGE = 9;
const DRAG_STEP_MS = 100;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (from, to) => Math.hypot(to.x - from.x, to.y - from.y);
const transform = ({ x, y }) => `translate(${x}px, ${y}px)`;
const viewportWidth = () => document.documentElement.clientWidth;
const viewportHeight = () => document.documentElement.clientHeight;

function visibleControls(pet) {
  const bottom = viewportHeight();
  return Array.from(document.querySelectorAll(CONTROL), (element) => pet.contains(element) ? null : element.getBoundingClientRect())
    .filter((rect) => rect?.width && rect.height && rect.bottom > 0 && rect.top < bottom);
}

function touchesControl({ x, y }, controls, size) {
  return controls.some(({ left, top, right, bottom }) => (
    x + size.width > left && x < right && y + size.height > top && y < bottom
  ));
}

function canTravel(from, to, controls, size) {
  const steps = Math.max(1, Math.ceil(distance(from, to) / 12));
  for (let index = 0; index <= steps; index++) {
    const progress = index / steps;
    const waypoint = { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
    if (touchesControl(waypoint, controls, size)) return false;
  }
  return true;
}

function positions(size) {
  const right = Math.max(EDGE, viewportWidth() - size.width - EDGE);
  const bottom = Math.max(EDGE, viewportHeight() - size.height - EDGE);
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

function titlePosition(size, controls) {
  const word = document.querySelector('#hero-title em');
  const heading = word?.closest('h1').getBoundingClientRect();
  if (!heading || heading.top < 0 || heading.bottom > viewportHeight() || (location.hash && location.hash !== '#top')) return;

  const range = document.createRange();
  range.selectNodeContents(word);
  const end = Array.from(range.getClientRects()).at(-1)?.right;
  const right = positions(size)[0].x;
  if (end == null || right < end) return;

  const next = { x: Math.min(right, Math.ceil(end) + 10), y: Math.round(heading.bottom - size.height + 5) };
  if (!touchesControl(next, controls, size)) return next;
}

export function createPet({ onTour }) {
  const pet = document.createElement('aside');
  pet.className = 'roaming-luma';
  pet.setAttribute('aria-label', 'Luma companion');
  pet.innerHTML = `
    <button type="button" class="luma-launcher" aria-label="Meet Luma" aria-expanded="false" aria-controls="luma-greeting"><span class="luma-sprite" aria-hidden="true"></span></button>
    <span class="luma-hello" aria-hidden="true" hidden>Hi, I’m Luma!</span>
    <div class="luma-greeting" id="luma-greeting" hidden>
      <div class="luma-greeting-header"><h2>Hi, I’m Luma!</h2><button type="button" aria-label="Close Luma greeting" class="luma-dismiss">×</button></div>
      <p>Come hear a NASA map with me. I’ll show you where the sounds come from.</p>
      <div class="luma-greeting-actions"><button type="button" class="luma-tour-launch">Take the tour</button><button type="button" class="luma-wander" aria-pressed="false">Pause wandering</button></div>
      <small>AI art</small>
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
  let entranceTimer;
  let helloTimer;
  let gazeTimer;
  let gazeFrame;
  let animation;
  let viewportFrame;
  let dragFrame;
  let position;
  let facing = 'right';
  let drag;
  let suppressClick = false;
  let loadedMovement = false;
  let peekHome;
  let lastPointer;

  try { paused = localStorage.getItem(PREFERENCE) === 'paused'; } catch { /* Current page preferences work without storage. */ }

  function size() {
    return { width: pet.offsetWidth, height: pet.offsetHeight };
  }

  function pose(value) {
    pet.dataset.pose = reducedMotion.matches ? 'idle' : value === 'idle' && !paused && gazeTimer ? 'gaze' : value;
  }

  function updatePanelPosition() {
    const viewport = viewportWidth();
    const { width: spriteWidth, height: spriteHeight } = size();
    const width = Math.min(288, viewport - EDGE * 2);
    const left = clamp(position.x + spriteWidth / 2 - width / 2, EDGE, viewport - EDGE - width);
    const above = position.y - EDGE;
    const below = viewportHeight() - position.y - spriteHeight - EDGE;
    const panelSide = above >= Math.min(220, below) ? 'above' : 'below';
    pet.style.setProperty('--luma-panel-width', `${width}px`);
    pet.style.setProperty('--luma-panel-left', `${left - position.x}px`);
    pet.style.setProperty('--luma-panel-height', `${Math.max(70, (panelSide === 'above' ? above : below) - 9)}px`);
    pet.dataset.panelSide = panelSide;
    pet.dataset.leftEdge = String(position.x < viewport / 2);
    pet.dataset.helloSide = position.y < 44 ? 'below' : 'above';
  }

  function place(next) {
    position = next;
    pet.style.transform = transform(next);
    updatePanelPosition();
  }

  function settle(resetPose = true) {
    if (!animation) return;
    const { x, y } = pet.getBoundingClientRect();
    animation.cancel();
    animation = undefined;
    if (resetPose) pose('idle');
    place({ x, y });
  }

  function walkTo(next, { duration, easing, onFinish }) {
    const from = position;
    if (Math.abs(next.x - from.x) > 1) facing = next.x < from.x ? 'left' : 'right';
    pose(facing);
    place(next);
    animation = pet.animate([{ transform: transform(from) }, { transform: transform(next) }], { duration, easing });
    animation.onfinish = () => {
      animation = undefined;
      pose('idle');
      onFinish();
    };
  }

  function stopWandering() {
    clearTimeout(timer);
    clearTimeout(entranceTimer);
    entranceTimer = undefined;
    delete pet.dataset.introPending;
    settle();
    if (peekHome) {
      place(peekHome);
      peekHome = undefined;
    }
    if (pet.dataset.pose === 'sleep' || pet.dataset.pose === 'peek') pose('idle');
  }

  function schedule(delay = 5000 + Math.random() * 4500) {
    if (peekHome) return;
    clearTimeout(timer);
    if (entranceTimer || paused || reducedMotion.matches || tourActive || hovering || drag || !panel.hidden || !greeting.hidden || document.hidden || pet.contains(document.activeElement)) return;
    timer = setTimeout(ambientAction, delay);
  }

  function peek(controls, dimensions) {
    const floor = positions(dimensions)[0].y;
    const side = position.x + dimensions.width / 2 < viewportWidth() / 2 ? 'left' : 'right';
    const offscreen = { x: side === 'left' ? -dimensions.width : viewportWidth(), y: floor };
    const visible = { x: offscreen.x + (side === 'left' ? 1 : -1) * dimensions.width * .42, y: floor };
    const edge = { x: side === 'left' ? EDGE : positions(dimensions)[0].x, y: floor };
    if (distance(position, edge) > 225 || !canTravel(position, edge, controls, dimensions) || !canTravel(edge, offscreen, controls, dimensions)) return false;

    const home = position;
    peekHome = home;
    const phases = [
      { point: edge, duration: Math.max(140, distance(home, edge) * 4.5) },
      { point: offscreen, duration: 240, pause: 330 },
      { point: visible, duration: 170, pause: 850 },
      { point: offscreen, duration: 170, pause: 280 },
      { point: edge, duration: 240 },
      { point: home, duration: Math.max(140, distance(home, edge) * 4.5) },
    ];
    function advance(index) {
      const phase = phases[index];
      if (!phase) {
        peekHome = undefined;
        schedule();
        return;
      }
      walkTo(phase.point, { duration: phase.duration, easing: 'ease-in-out', onFinish() {
        if (phase.point === visible) {
          pet.style.setProperty('--luma-peek-row', side === 'left' ? '0' : '-1');
          pose('peek');
        }
        timer = setTimeout(() => advance(index + 1), phase.pause ?? 0);
      } });
    }
    advance(0);
    return true;
  }

  function ambientAction() {
    const action = Math.random();
    if (action < .26 && pet.dataset.pose !== 'sleep') {
      pose('sleep');
      timer = setTimeout(() => { pose('idle'); schedule(2200); }, 4000 + Math.random() * 3500);
      return;
    }
    const controls = visibleControls(pet);
    const dimensions = size();
    if (action < .48 && peek(controls, dimensions)) return;
    const limits = positions(dimensions);
    const max = limits[0];
    const nearby = [-108, -62, 62, 108].flatMap((dx) => [0, -34, 34].map((dy) => ({
      x: clamp(position.x + dx, EDGE, max.x), y: clamp(position.y + dy, EDGE, max.y),
    })));
    const options = [...nearby, ...limits].filter((point) => {
      const travel = distance(position, point);
      return travel >= 46 && travel <= Math.min(290, viewportWidth() * 0.76) && canTravel(position, point, controls, dimensions);
    });
    if (!options.length) { schedule(); return; }

    const next = options[Math.floor(Math.random() * options.length)];
    walkTo(next, {
      duration: clamp(distance(position, next) * 10.5, 850, 3400),
      easing: 'cubic-bezier(.32,.07,.49,.98)',
      onFinish: schedule,
    });
  }

  function greet() {
    greeting.hidden = false;
    pose('wave');
    helloTimer = setTimeout(() => { greeting.hidden = true; schedule(2600); }, 3900);
  }

  function introduce() {
    entranceTimer = undefined;
    delete pet.dataset.introPending;
    const dimensions = size();
    const controls = visibleControls(pet);
    const next = titlePosition(dimensions, controls);
    if (!next || paused || reducedMotion.matches) {
      if (next) place(next);
      greet();
      return;
    }

    const start = { x: positions(dimensions)[0].x, y: next.y };
    place(start);
    if (distance(start, next) < 12) {
      place(next);
      greet();
      return;
    }
    walkTo(next, {
      duration: clamp(distance(start, next) * 3.5, 750, 2100),
      easing: 'cubic-bezier(.34,.08,.51,.96)',
      onFinish: greet,
    });
  }

  function trackGaze() {
    gazeFrame = undefined;
    if (!lastPointer || paused || reducedMotion.matches || !['idle', 'gaze'].includes(pet.dataset.pose)) return;
    const bounds = sprite.getBoundingClientRect();
    const dx = lastPointer.x - bounds.x - bounds.width / 2;
    const dy = lastPointer.y - bounds.y - bounds.height * .42;
    if (Math.hypot(dx, dy) < 6) return;
    const direction = Math.round((Math.atan2(dx, -dy) * 180 / Math.PI + 360) / 22.5) % 16;
    pet.style.setProperty('--luma-look-column', String(-(direction % 8)));
    pet.style.setProperty('--luma-look-row', String(-Math.floor(direction / 8)));
    clearTimeout(gazeTimer);
    gazeTimer = setTimeout(() => {
      gazeTimer = undefined;
      if (pet.dataset.pose === 'gaze') pose('idle');
    }, 2400);
    pose('idle');
  }

  function keepClear() {
    if (viewportFrame || tourActive || drag) return;
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = undefined;
      if (tourActive || drag) return;
      stopWandering();
      const dimensions = size();
      const controls = visibleControls(pet);
      const outside = position.x < 0 || position.y < 0 || position.x + dimensions.width > viewportWidth()
        || position.y + dimensions.height > viewportHeight();
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
      pose('idle');
      return;
    }
    if (!loadedMovement) {
      loadedMovement = true;
      for (const asset of ['run-left', 'run-right', 'gaze']) {
        const spriteStrip = new Image();
        spriteStrip.src = `${import.meta.env.BASE_URL}luma/${asset}.webp`;
      }
    }
    schedule();
  }

  // Retarget the same walk from the rendered position once per paint, as on keyboard.wtf.
  function followDrag() {
    dragFrame = undefined;
    const next = drag?.pending;
    if (!next) return;
    drag.pending = undefined;
    settle(false);
    if (reducedMotion.matches || distance(position, next) < 0.5) {
      pose('idle');
      place(next);
      return;
    }
    walkTo(next, {
      duration: DRAG_STEP_MS,
      easing: 'cubic-bezier(.33, 0, .67, 1)',
      onFinish() { if (!drag) keepClear(); },
    });
  }

  launcher.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag || !panel.hidden) return;
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
    drag.pending = {
      x: clamp(drag.origin.x + x, EDGE, Math.max(EDGE, viewportWidth() - dimensions.width - EDGE)),
      y: clamp(drag.origin.y + y, EDGE, Math.max(EDGE, viewportHeight() - dimensions.height - EDGE)),
    };
    if (!dragFrame) dragFrame = requestAnimationFrame(followDrag);
  }, listeners);

  function release(event) {
    if (drag?.id !== event.pointerId) return;
    cancelAnimationFrame(dragFrame);
    dragFrame = undefined;
    if (event.type === 'pointercancel') settle();
    else followDrag();
    suppressClick = drag.moving;
    drag = undefined;
    delete pet.dataset.dragging;
    if (!animation) keepClear();
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
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || tourActive || reducedMotion.matches) return;
    lastPointer = { x: event.clientX, y: event.clientY };
    if (!gazeFrame) gazeFrame = requestAnimationFrame(trackGaze);
  }, { ...listeners, passive: true });
  document.addEventListener('focusin', (event) => {
    if (pet.contains(event.target)) return;
    if (!panel.hidden) setGreeting(false);
    keepClear();
  }, listeners);
  document.addEventListener('visibilitychange', () => document.hidden ? stopWandering() : schedule(), listeners);
  window.addEventListener('scroll', keepClear, { ...listeners, passive: true });
  window.addEventListener('resize', keepClear, { ...listeners, passive: true });
  reducedMotion.addEventListener('change', updatePreference, listeners);

  const dimensions = size();
  const anchor = titlePosition(dimensions, visibleControls(pet));
  place(anchor ?? positions(dimensions)[0]);
  pose('idle');
  updatePreference();
  clearTimeout(timer);
  pet.dataset.introPending = 'true';
  entranceTimer = setTimeout(introduce, reducedMotion.matches ? 140 : 560);

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
      clearTimeout(gazeTimer);
      cancelAnimationFrame(gazeFrame);
      cancelAnimationFrame(viewportFrame);
      cancelAnimationFrame(dragFrame);
      stopWandering();
      pet.remove();
    },
  };
}
