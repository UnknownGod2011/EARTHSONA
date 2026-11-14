import './tour.css';
import { icon } from './icons.js';
import { createNarration } from './narration.js';

const gap = 14;
const edge = 12;

function buildSteps({ showFrame, playFrame, showComparison, openEvidence, showSources, arcticSummary }) {
  return [
    {
      target: '#hero-title',
      chapter: 'First contact',
      title: 'Hello, I’m Luma.',
      copy: 'Can you hear a warming planet? I’ll show you how a NASA map becomes sound, then we’ll listen to how the Arctic and the world have changed.',
    },
    {
      target: '.frame-mat',
      chapter: 'NASA map scan',
      title: 'Listen from north to south.',
      copy: 'Play six notes made from the pixels of NASA’s 2025 map. The highlighted stripe shows where each note comes from. Redder stripes sound higher.',
      enter: showFrame,
      action: { text: 'Play the map scan', run: playFrame, audio: true },
      controls: ['#frame-source'],
    },
    {
      target: '#globe-controls',
      chapter: 'Climate tracks',
      title: 'Compare on one scale.',
      copy: 'Choose two tracks and move Year to compare the Arctic and global mean. Both tracks use the same pitch scale and their own 1951–1980 average as a baseline.',
      enter: showComparison,
      controls: ['#primary', '#comparison', '#year'],
    },
    {
      target: '#chart',
      chapter: 'Arctic and global',
      title: 'Hear the gap open.',
      copy: arcticSummary ?? 'Compare the Arctic band and the global mean across two ten-year windows. Hear how the gap changes when each reading uses the same instrument and pitch scale.',
      enter: showComparison,
      action: { text: 'Hear the two periods', run: openEvidence, handoff: true },
    },
    {
      target: '#findings .section-heading',
      chapter: 'Discoveries',
      title: 'Follow another pattern.',
      copy: 'Every discovery opens its own tracks and time window. Try the 2016 polar comparison, or listen to the three warmest annual estimates in our NASA record.',
      controls: ['#insight-grid .insight-link'],
    },
    {
      target: '#method-title',
      chapter: 'Method and sources',
      title: 'Trace what you heard.',
      copy: 'The maps come from NASA’s Earth Information Center. The temperature comparisons use published NASA GISTEMP values. Here you can check the pitch formula and download the data.',
      enter: showSources,
      controls: ['#method .text-link[href]'],
    },
  ];
}

function fitBetween(number, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, number));
}

export function createTour(options = {}) {
  const steps = buildSteps(options);
  const host = document.createElement('div');
  host.id = 'luma-tour';
  host.className = 'tour-layer';
  host.hidden = true;
  host.innerHTML = `
    <div class="tour-spotlight" aria-hidden="true"></div>
    <section class="tour-coach" role="dialog" aria-labelledby="tour-title" aria-describedby="tour-copy">
      <div class="tour-header">
        <span class="tour-portrait" aria-hidden="true"><span></span></span>
        <div><p class="tour-kicker">Luma <span>· AI artwork</span></p><p id="tour-chapter" class="tour-chapter"></p></div>
        <button id="tour-close" class="tour-close" type="button" aria-label="Close tour">×</button>
      </div>
      <div class="tour-progress" aria-hidden="true">${steps.map(() => '<i></i>').join('')}</div>
      <h2 id="tour-title" tabindex="-1"></h2>
      <p id="tour-copy"></p>
      <div id="tour-extras" class="tour-extras">
        <button id="tour-action" class="tour-action" type="button" hidden></button>
        <button id="tour-speak" class="tour-speak" type="button" hidden></button>
      </div>
      <div class="tour-navigation">
        <button id="tour-back" type="button">Back</button>
        <button id="tour-next" type="button">Next ${icon('arrow', 17)}</button>
      </div>
    </section>`;
  document.body.append(host);

  const get = (name) => host.querySelector(`#tour-${name}`);
  const coach = host.querySelector('.tour-coach');
  const spotlight = host.querySelector('.tour-spotlight');
  const progress = host.querySelector('.tour-progress');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mainPlay = document.getElementById('play');
  let trigger;
  let anchor;
  let stage = 0;
  let frame = 0;

  function updateExtras() {
    get('extras').hidden = get('action').hidden && get('speak').hidden;
  }

  const narration = createNarration(({ available, speaking }) => {
    get('speak').hidden = !available;
    get('speak').innerHTML = `${icon(speaking ? 'mute' : 'speaker', 16)} ${speaking ? 'Stop reading' : 'Read aloud'}`;
    updateExtras();
    requestPosition();
  });

  function requestPosition() {
    if (!host.hidden && !frame) frame = requestAnimationFrame(position);
  }

  function position() {
    frame = 0;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const coachWidth = coach.offsetWidth;
    const coachHeight = coach.offsetHeight;
    const box = anchor?.getBoundingClientRect();
    const visible = box?.width > 0 && box.height > 0 && box.bottom > 0 && box.top < height;
    spotlight.hidden = !visible;

    if (!visible) {
      coach.style.left = `${width - coachWidth - edge}px`;
      coach.style.top = `${height - coachHeight - edge}px`;
      return;
    }

    const left = fitBetween(box.left - 5, 3, width - 3);
    const right = fitBetween(box.right + 5, 3, width - 3);
    const top = fitBetween(box.top - 5, 3, height - 3);
    const bottom = fitBetween(box.bottom + 5, 3, height - 3);
    Object.assign(spotlight.style, { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` });

    const maxX = width - coachWidth - edge;
    const maxY = height - coachHeight - edge;
    let x = fitBetween((left + right - coachWidth) / 2, edge, maxX);
    let y = maxY;
    if (width > 680 && right + gap <= maxX) {
      x = right + gap;
      y = fitBetween((top + bottom - coachHeight) / 2, edge, maxY);
    } else if (width > 680 && left - gap - coachWidth >= edge) {
      x = left - gap - coachWidth;
      y = fitBetween((top + bottom - coachHeight) / 2, edge, maxY);
    } else if (bottom + gap <= maxY) {
      y = bottom + gap;
    } else if (top - gap - coachHeight >= edge) {
      y = top - gap - coachHeight;
    }
    coach.style.left = `${x}px`;
    coach.style.top = `${y}px`;
  }

  function showTarget() {
    if (!anchor) return;
    const { top, height } = anchor.getBoundingClientRect();
    const usableHeight = window.innerHeight - coach.offsetHeight - 28;
    const center = Math.max(16, Math.min(98, (usableHeight - height) / 2));
    if (top < 10 || top + height + coach.offsetHeight + 30 > window.innerHeight || top > 145) {
      window.scrollTo({ top: Math.max(0, window.scrollY + top - center), behavior: 'instant' });
    }
    position();
  }

  function updateAction() {
    const action = steps[stage].action;
    const playing = action?.audio && mainPlay?.getAttribute('aria-label') === 'Pause';
    get('action').hidden = !action?.run;
    if (!action) return;
    get('action').innerHTML = `${icon(action.audio ? (playing ? 'pause' : 'play') : 'wave', 17)} ${playing ? 'Pause map scan' : action.text}`;
    updateExtras();
  }

  function render() {
    const step = steps[stage];
    step.enter?.();
    anchor = document.querySelector(step.target);
    host.dataset.step = String(stage + 1);
    host.dataset.target = step.target;
    get('chapter').textContent = `${String(stage + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} · ${step.chapter}`;
    get('title').textContent = step.title;
    get('copy').textContent = step.copy;
    for (const [index, bar] of [...progress.children].entries()) bar.dataset.state = index === stage ? 'current' : index < stage ? 'done' : 'next';
    get('back').disabled = stage === 0;
    get('next').innerHTML = stage === steps.length - 1 ? 'Finish tour' : `Next ${icon('arrow', 17)}`;
    updateAction();
    updateExtras();
    get('title').focus({ preventScroll: true });
    coach.scrollTop = 0;
    showTarget();
    if (typeof coach.animate === 'function' && !reduce.matches) {
      coach.getAnimations().forEach((animation) => animation.cancel());
      coach.animate([{ opacity: 0.5, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'ease-out' });
    }
    observer.disconnect();
    observer.observe(coach);
    if (anchor) observer.observe(anchor);
  }

  function stopCues() {
    narration.stop();
    options.stopAudio?.();
  }

  function close({ restoreFocus = true } = {}) {
    if (host.hidden) return;
    host.hidden = true;
    stopCues();
    observer.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    options.onActiveChange?.(false);
    if (restoreFocus && trigger?.isConnected) trigger.focus();
  }

  function go(index) {
    if (index < 0) return;
    if (index === steps.length) {
      close({ restoreFocus: false });
      document.getElementById('method')?.focus({ preventScroll: true });
      return;
    }
    stopCues();
    stage = index;
    render();
  }

  function loopFocus(event) {
    const items = [...coach.querySelectorAll('button:not([disabled]):not([hidden])')];
    for (const selector of steps[stage].controls ?? []) {
      items.push(...document.querySelectorAll(selector));
    }
    const available = items.filter((item) => !item.disabled && item.getClientRects().length);
    const current = available.indexOf(document.activeElement);
    const next = current < 0 ? (event.shiftKey ? -1 : 0) : current + (event.shiftKey ? -1 : 1);
    event.preventDefault();
    available.at(next % available.length)?.focus();
  }

  const observer = new ResizeObserver(requestPosition);
  if (mainPlay) {
    new MutationObserver(updateAction).observe(mainPlay, { attributes: true, attributeFilter: ['aria-label'] });
    mainPlay.addEventListener('click', () => narration.stop(), { capture: true });
  }
  window.addEventListener('resize', requestPosition);
  window.addEventListener('scroll', requestPosition, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (host.hidden || event.defaultPrevented) return;
    if (event.key === 'Tab') loopFocus(event);
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });
  get('next').onclick = () => go(stage + 1);
  get('back').onclick = () => go(stage - 1);
  get('close').onclick = () => close();
  get('speak').onclick = () => {
    if (narration.speaking) return narration.stop();
    options.stopAudio?.();
    const { title, copy } = steps[stage];
    narration.speak(`${title} ${copy}`);
  };
  get('action').onclick = () => {
    const { action } = steps[stage];
    if (!action?.run) return;
    narration.stop();
    if (action.handoff) {
      const source = trigger;
      const stepToResume = stage + 1;
      close({ restoreFocus: false });
      action.run(source, () => open(source, stepToResume));
    } else {
      action.run(trigger);
    }
  };

  function open(source, initialStage = 0) {
    if (!host.hidden) return;
    trigger = source || document.activeElement;
    stopCues();
    host.hidden = false;
    stage = initialStage;
    options.onActiveChange?.(true);
    render();
  }

  return {
    open,
    close,
    get active() { return !host.hidden; },
  };
}
