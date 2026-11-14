import './guide.css';
import { extractFrameScan } from './frame-scan.js';
import { icon } from './icons.js';
import { createNarration } from './narration.js';
import { anomalyFrequency, Player, scanScore } from './sonification.js';

const windows = [[1980, 1989], [2016, 2025]];
const regions = [{ id: 'arctic', label: 'Arctic band' }, { id: 'global', label: 'Global mean' }];
const stepLabels = ['NASA map scan', 'Compare two periods', 'See the result'];
const clipSeconds = 0.55;
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const format = (value) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)}°C`;

export function createDecadeComparison(observations) {
  return windows.map(([from, to]) => {
    const years = observations.filter(({ year }) => year >= from && year <= to);
    if (years.length !== to - from + 1) throw new Error(`The GISTEMP record for ${from}–${to} is incomplete.`);
    const tones = regions.map(({ id, label }) => {
      const annualValues = years.map(({ values }) => values[id]);
      if (!annualValues.every(Number.isFinite)) throw new Error(`The ${label.toLowerCase()} is missing an annual value.`);
      const mean = annualValues.reduce((sum, value) => sum + value, 0) / annualValues.length;
      return { id: `${from}-${id}`, label, mean, frequency: anomalyFrequency(mean) };
    });
    return { from, to, label: `${from}–${to}`, tones };
  });
}

function comparisonScore(periods) {
  const [early, recent] = periods.map(({ tones }) => tones.map(({ id, frequency }) => ({
    id, duration: clipSeconds, notes: [{ frequency, offset: 0, pan: 0, wave: 'sine' }],
  })));
  return [...early, { id: 'pause', duration: 1.05, notes: [] }, ...recent];
}

function frameScene(frame) {
  return `<div class="guide-frame-wrap">
    <div class="guide-frame">
      <img src="${asset(frame.image)}" alt="${frame.alt}" width="${frame.width}" height="${frame.height}" />
      <span class="guide-frame-beam" aria-hidden="true" hidden></span>
    </div>
    <a href="${frame.sourceUrl}" target="_blank" rel="noreferrer">NASA Scientific Visualization Studio · ${frame.year} map ${icon('external', 14)}</a>
    <details id="guide-scan-readings" hidden><summary>Read the six scan notes ${icon('chevron', 14)}</summary><ol></ol></details>
  </div>`;
}

function comparisonScene(periods) {
  return `<div id="guide-periods" class="guide-periods">${periods.map(({ label, tones }) => `
    <div class="guide-window" data-active="false">
      <h3>${label}</h3>
      <div class="guide-tones">${tones.map(({ id, label: region }) => `
        <div class="guide-tone" data-tone="${id}" data-active="false">
          <span class="guide-tone-wave">${icon('wave', 27)}</span><span>${region}</span>
        </div>`).join('')}
      </div>
    </div>`).join('')}</div>`;
}

function resultScene(periods) {
  const [early, recent] = periods;
  const change = (index) => recent.tones[index].mean - early.tones[index].mean;
  return `<div id="guide-evidence" class="guide-evidence">
    <p class="guide-finding">${regions.map(({ label }, index) => `<span class="guide-finding-value">${format(change(index))}<strong>${label}</strong></span>`).join('')}</p>
    <table>
      <caption>Mean GISTEMP anomalies relative to the 1951–1980 baseline</caption>
      <thead><tr><th scope="col">Series</th><th scope="col">${early.label}</th><th scope="col">${recent.label}</th></tr></thead>
      <tbody>${regions.map(({ label }, index) => `<tr><th scope="row">${label}</th>${periods.map(({ tones }) => `<td data-tone="${tones[index].id}">${format(tones[index].mean)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <p>Each note uses a ten-year mean. The global mean includes the Arctic band (64–90°N). These figures describe the two selected periods.</p>
    <a href="https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv" target="_blank" rel="noreferrer">Open NASA’s annual source table ${icon('external', 14)}</a>
  </div>`;
}

export function createGuide({ observations, frame, onFrame, onCompare, onOpen, onSources }) {
  const periods = createDecadeComparison(observations);
  const dialog = document.createElement('dialog');
  dialog.id = 'luma-guide';
  dialog.className = 'guide-dialog';
  dialog.setAttribute('aria-labelledby', 'guide-heading');
  dialog.innerHTML = `
    <div class="guide-header">
      <div class="guide-character" aria-hidden="true"><div class="guide-pet" data-pose="idle"></div></div>
      <div class="guide-heading-block"><p class="guide-kicker">Listen with Luma <span>· AI artwork</span></p><h2 id="guide-heading" tabindex="-1"></h2></div>
      <button id="guide-close" class="guide-close" type="button" aria-label="Close guide">×</button>
    </div>
    <ol class="guide-progress" aria-label="Walkthrough progress">${stepLabels.map((label) => `<li>${label}</li>`).join('')}</ol>
    <p id="guide-intro" class="guide-intro"></p>
    <div id="guide-scene"></div>
    <p id="guide-status" class="guide-status"></p>
    <p id="guide-announcement" class="guide-visually-hidden" role="status"></p>
    <div class="guide-controls">
      <div class="guide-audio-controls">
        <button id="guide-listen" type="button" class="guide-play"></button>
        <button id="guide-speak" type="button" class="guide-text-button" hidden>${icon('speaker', 17)} Read aloud</button>
      </div>
      <div class="guide-navigation">
        <button id="guide-back" type="button" class="guide-text-button" hidden>Back</button>
        <button id="guide-next" type="button" class="guide-next">Continue ${icon('arrow', 17)}</button>
        <button id="guide-sources" type="button" class="guide-next" hidden>Visit method &amp; sources ${icon('arrow', 17)}</button>
      </div>
    </div>`;
  document.body.append(dialog);

  const get = (name) => dialog.querySelector(`#guide-${name}`);
  const pet = dialog.querySelector('.guide-pet');
  const player = new Player();
  let step = 0;
  let trigger;
  let scan;
  let isPlaying = false;
  let run = 0;
  let afterClose;
  let returnToTour;
  const narration = createNarration(showSpeakControl);
  const intros = [
    'Can you hear a map? Six notes follow the colors of a NASA temperature map from north to south. Redder stripes play higher pitches. The palette affects the sound, so use the next step to compare temperatures.',
    'Listen to the Arctic band and the global mean for each period. Every note uses the same voice and pitch scale. Which pair sounds farther apart?',
    'The Arctic and global notes were almost the same in the 1980s. The Arctic note sits much higher in 2016–2025.',
  ];

  function showListenControl() {
    const labels = ['Play 2025 map scan', 'Hear both pairs', 'Replay comparison'];
    get('listen').innerHTML = `${icon(isPlaying ? 'pause' : 'play', 20)} ${isPlaying ? 'Stop audio' : labels[step]}`;
  }

  function showSpeakControl({ available, speaking }) {
    const control = get('speak');
    control.hidden = !available;
    control.innerHTML = `${icon(speaking ? 'mute' : 'speaker', 17)} ${speaking ? 'Stop reading' : 'Read aloud'}`;
  }

  function restStatus() {
    return step === 0 ? 'Map colors · Six stripes' : step === 1 ? 'NASA annual values · Arctic band first in each pair' : 'NASA GISTEMP v4 · Annual Land–Ocean Temperature Index';
  }

  function showScanReadings() {
    if (!scan) return;
    const readings = get('scan-readings');
    readings.querySelector('ol').innerHTML = scan.bands.map(({ label, frequency }) => `<li><strong>${label}</strong><span>${frequency === null ? 'No samples' : `${Math.round(frequency)} Hz`}</span></li>`).join('');
    readings.hidden = false;
  }

  function stopAudio() {
    run++;
    isPlaying = false;
    player.stop();
    showListenControl();
    if (pet.dataset.pose === 'listen') pet.dataset.pose = 'idle';
    const beam = dialog.querySelector('.guide-frame-beam');
    if (beam) beam.hidden = true;
    for (const node of dialog.querySelectorAll('[data-active="true"]')) node.dataset.active = 'false';
    get('status').textContent = restStatus();
    get('announcement').textContent = '';
  }

  function renderStep() {
    get('heading').textContent = ['Hear NASA’s map', 'Hear the Arctic pull away', 'What changed?'][step];
    get('intro').textContent = intros[step];
    get('scene').innerHTML = step === 0 ? frameScene(frame) : step === 1 ? comparisonScene(periods) : resultScene(periods);
    if (step === 0) showScanReadings();
    const progress = dialog.querySelectorAll('.guide-progress li');
    for (const [index, item] of progress.entries()) {
      item.dataset.complete = String(index < step);
      if (index === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    }
    get('back').hidden = step === 0;
    get('next').hidden = step === 2;
    get('next').innerHTML = `${step === 1 ? 'Reveal the result' : 'Continue'} ${icon('arrow', 17)}`;
    get('sources').hidden = step !== 2;
    get('status').textContent = restStatus();
    showListenControl();
    pet.dataset.pose = step === 0 ? 'wave' : step === 2 ? 'react' : 'idle';
    get('heading').focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }

  function changeStep(next) {
    narration.stop();
    stopAudio();
    step = next;
    if (step === 0) onFrame?.();
    else if (step === 1) onCompare?.();
    renderStep();
  }

  function scanStep(id) {
    const band = scan.bands.find((item) => item.id === id);
    const beam = dialog.querySelector('.guide-frame-beam');
    beam.style.top = `${band.y * 100}%`;
    beam.style.height = `${band.height * 100}%`;
    beam.hidden = false;
    const frequency = band.frequency === null ? 'no valid samples' : `${Math.round(band.frequency)} Hz`;
    get('status').textContent = `${band.label} · ${frequency}`;
  }

  function toneStep(id) {
    for (const node of dialog.querySelectorAll('[data-tone]')) node.dataset.active = String(node.dataset.tone === id);
    for (const node of dialog.querySelectorAll('.guide-window')) node.dataset.active = String(node.querySelector('[data-active="true"]') !== null);
    if (id === 'pause') {
      get('status').textContent = 'Next: 2016–2025';
      return;
    }
    const period = periods.find(({ tones }) => tones.some((tone) => tone.id === id));
    const tone = period.tones.find((item) => item.id === id);
    get('status').textContent = `${period.label} · ${tone.label}`;
  }

  async function listen() {
    narration.stop();
    if (isPlaying) {
      stopAudio();
      return;
    }
    const id = ++run;
    const fromFrame = step === 0;
    isPlaying = true;
    pet.dataset.pose = 'listen';
    showListenControl();
    try {
      const unlocked = player.unlock();
      if (fromFrame && !scan) {
        const image = dialog.querySelector('.guide-frame img');
        await Promise.all([unlocked, image.decode()]);
        if (id !== run || !dialog.open) return;
        scan = extractFrameScan(image);
        showScanReadings();
      } else {
        await unlocked;
      }
      if (id !== run || !dialog.open) return;
      const score = fromFrame ? scanScore(scan.bands) : comparisonScore(periods);
      await player.play(score, fromFrame ? scanStep : toneStep, () => {
        if (id !== run) return;
        stopAudio();
        get('announcement').textContent = 'Playback finished.';
      });
    } catch {
      if (id !== run) return;
      stopAudio();
      get('status').textContent = 'Audio could not start. Continue to read the result.';
      get('announcement').textContent = get('status').textContent;
    }
  }

  function readAloud() {
    if (narration.speaking) {
      narration.stop();
      return;
    }
    stopAudio();
    const [early, recent] = periods;
    const spokenChange = (index) => {
      const change = recent.tones[index].mean - early.tones[index].mean;
      return `${change < 0 ? 'fell' : 'rose'} ${Math.abs(change).toFixed(2)} degrees Celsius`;
    };
    const explanation = step === 2
      ? ` From the earlier to the later period, the Arctic anomaly ${spokenChange(0)} and the global anomaly ${spokenChange(1)}.`
      : '';
    const heading = get('heading').textContent;
    narration.speak(`${heading}${heading.endsWith('?') ? '' : '.'} ${intros[step]}${explanation}`);
  }

  get('listen').addEventListener('click', listen);
  get('speak').addEventListener('click', readAloud);
  get('next').addEventListener('click', () => changeStep(step + 1));
  get('back').addEventListener('click', () => changeStep(step - 1));
  get('close').addEventListener('click', () => dialog.close());
  get('sources').addEventListener('click', () => {
    afterClose = returnToTour || onSources;
    dialog.close();
  });
  pet.addEventListener('animationend', () => { pet.dataset.pose = 'idle'; });
  dialog.addEventListener('close', () => {
    narration.stop();
    stopAudio();
    document.documentElement.classList.remove('guide-open');
    const leave = afterClose || returnToTour;
    if (leave) leave();
    else trigger?.focus({ preventScroll: true });
    afterClose = undefined;
    returnToTour = undefined;
  });

  return {
    open(source, firstStep = 0, resume) {
      if (dialog.open) return;
      trigger = source || document.activeElement;
      returnToTour = resume;
      onOpen?.();
      document.documentElement.classList.add('guide-open');
      dialog.showModal();
      changeStep(firstStep);
      get('sources').innerHTML = `${resume ? 'Continue the tour' : 'Visit method &amp; sources'} ${icon('arrow', 17)}`;
    },
  };
}
