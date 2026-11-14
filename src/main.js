import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/geist/latin-700.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './style.css';
import './theme.css';
import climate from './data/climate.json';
import eic from './data/eic.json';
import { ANOMALY_SCALE, createGlobe } from './globe.js';
import { extractFrameScan } from './frame-scan.js';
import { Player, anomalyFrequency, temperatureScore, scanScore } from './sonification.js';
import { renderChart } from './chart.js';
import { layout } from './layout.js';
import { icon } from './icons.js';
import { initBrand } from './brand.js';
import { initTheme, initTitleReveal } from './intro.js';
import { createGuide } from './guide.js';
import { createPet } from './pet.js';
import { createTour } from './tour.js';

const { source, series, observations, insights } = climate;
const { first, last } = source.years;
const byYear = new Map(observations.map((observation) => [observation.year, observation]));
const tracks = new Map(series.map((track) => [track.id, track]));
const $ = (id) => document.getElementById(id);
const audio = new Player();
const state = { mode: 'globe', year: last, from: 2014, to: last, primary: 'arctic', comparison: 'antarctic', rate: 4, playing: false, nextStep: 0, frame: eic.frames.at(-1).year, muted: false };
const scopeNotes = 'NASA GISS annual Land–Ocean Temperature Index, relative to the 1951–1980 baseline.';
const format = (n) => Number.isFinite(n) ? `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}°C` : 'No data';
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
let chart;
let scan;
let run = 0;
let hoveredBand = null;
let textureLoaded = true;

$('app').innerHTML = layout(first, last);
initBrand();
initTheme();
initTitleReveal();
const sky = $('sky-backdrop');
const globe = createGlobe($('earth'), {
  onSelect(id) { chooseTrack(id); },
  onHover(id) { hoveredBand = id; updateGlobeCaption(); },
  onView({ longitude, latitude }) {
    sky.style.setProperty('--sky-x', `${(longitude + 24) * -1280 / 360}px`);
    sky.style.setProperty('--sky-y', `${(latitude - 24) * 0.65}px`);
  },
});
globe.ready.then((loaded) => {
  textureLoaded = loaded;
  updateGlobeCaption();
});
$('legend-min').textContent = `−${ANOMALY_SCALE.limit}`;
$('legend-max').textContent = `+${ANOMALY_SCALE.limit}`;
$('globe-legend').style.setProperty('--cold', ANOMALY_SCALE.cold);
$('globe-legend').style.setProperty('--neutral', ANOMALY_SCALE.neutral);
$('globe-legend').style.setProperty('--warm', ANOMALY_SCALE.warm);

function updateGlobeCaption() {
  $('globe-status').textContent = hoveredBand
    ? `${tracks.get(hoveredBand).shortLabel} · ${format(byYear.get(state.year).values[hoveredBand])}`
    : textureLoaded ? 'NASA BLUE MARBLE BASEMAP' : 'BASEMAP UNAVAILABLE · BAND OVERLAY';
}

function updateSelects() {
  $('primary').innerHTML = series.map(({ id, label }) => `<option value="${id}">${label}</option>`).join('');
  $('comparison').innerHTML = `<option value="">None · solo track</option>${series.filter(({ id }) => id !== state.primary).map(({ id, label }) => `<option value="${id}">${label}</option>`).join('')}`;
  $('primary').value = state.primary;
  $('comparison').value = state.comparison;
}

function updateReading(year) {
  state.year = year;
  const { values } = byYear.get(year);
  $('year').value = year;
  $('year').setAttribute('aria-valuetext', `${year}, ${format(values[state.primary])} primary`);
  $('globe-year').textContent = year;
  $('year-output').textContent = year;
  $('primary-value').textContent = format(values[state.primary]);
  $('compare-value').textContent = state.comparison ? format(values[state.comparison]) : '—';
  const hz = anomalyFrequency(values[state.primary]);
  $('frequency').textContent = hz === null ? '—' : `${Math.round(hz)} HZ`;
  if (state.mode === 'globe') {
    updateGlobeCaption();
    globe.setBands(series.slice(1).map(({ id, minLatitude, maxLatitude }) => ({
      id, south: minLatitude, north: maxLatitude, anomaly: values[id],
      role: id === state.primary ? 'primary' : id === state.comparison ? 'comparison' : undefined,
    })));
  }
  chart?.update(year, values);
}

function showMessage(message = '') {
  $('audio-message').textContent = message;
  $('audio-message').hidden = !message;
}

function visibleObservations() {
  return observations.slice(state.from - first, state.to - first + 1);
}

function renderTimeline() {
  const points = visibleObservations();
  chart = renderChart($('chart'), points, state.primary, state.comparison);
  const labels = [state.primary, state.comparison].filter(Boolean);
  $('chart-labels').innerHTML = labels.map((id, i) => `<span class="track-key key-${i}">${tracks.get(id).label}</span>`).join('');
  if ($('table-details').open) renderTable(points, labels);
  updateReading(state.year);
}

function renderTable(points, ids) {
  $('data-table').innerHTML = `<table><caption>${scopeNotes}</caption><thead><tr><th scope="col">Year</th>${ids.map((id) => `<th scope="col">${tracks.get(id).label}</th>`).join('')}</tr></thead><tbody>${points.map(({ year, values }) => `<tr><th scope="row">${year}</th>${ids.map((id) => `<td>${format(values[id])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function updateRange() {
  $('from-year').value = state.from;
  $('to-year').value = state.to;
  $('speed').value = state.rate;
  $('year').min = state.from;
  $('year').max = state.to;
  $('year').disabled = state.from === state.to;
  document.querySelector('.range-endpoints').innerHTML = `<span>${state.from}</span><span>${state.to}</span>`;
  $('chart').title = `Annual readings from ${state.from} to ${state.to}`;
}

function updatePlayback() {
  const frameMode = state.mode === 'frame';
  const paused = !state.playing && state.nextStep > 0;
  $('play').innerHTML = icon(state.playing ? 'pause' : 'play', 24);
  $('play').setAttribute('aria-label', state.playing ? 'Pause' : paused ? 'Resume' : 'Play');
  $('play-title').textContent = state.playing ? 'Pause playback' : paused ? 'Resume playback' : frameMode ? 'Play NASA frame' : state.comparison ? 'Play comparison' : 'Play track';
  $('play-detail').textContent = frameMode ? `${state.frame} · ${$('frame-audio').value === 'pixels' ? 'COLOR SCAN' : 'GLOBAL ANOMALY'}` : `${state.from}–${state.to} · ${state.rate} YR/SEC`;
}

function stopPlayback(reset = true) {
  run++;
  audio.stop();
  state.playing = false;
  if (reset) state.nextStep = 0;
  $('frame-beam').hidden = true;
  updatePlayback();
}

function highlightScan(id) {
  const band = scan.bands.find((entry) => entry.id === id);
  const beam = $('frame-beam');
  beam.hidden = false;
  beam.style.top = `${band.y * 100}%`;
  beam.style.height = `${band.height * 100}%`;
  $('scan-status').textContent = `${band.label} · ${band.frequency === null ? 'No samples' : `${Math.round(band.frequency)} Hz`}`;
}

function showScanNotes() {
  const pixels = $('frame-audio').value === 'pixels';
  $('frame-limitation').textContent = pixels
    ? 'Pitch follows colors in this image. Compare temperatures across years in Climate globe.'
    : 'One note represents the published global anomaly in °C, relative to 1951–1980.';
  $('scan-readings').hidden = !scan || !pixels;
  if (!scan) return;
  $('scan-note-list').innerHTML = scan.bands.map(({ label, frequency }) => `<li>${label} · ${frequency === null ? 'No samples' : `${Math.round(frequency)} Hz`}</li>`).join('');
}

async function playSelection() {
  if (state.playing) {
    stopPlayback(false);
    return;
  }
  const generation = ++run;
  const frameMode = state.mode === 'frame';
  const pixels = frameMode && $('frame-audio').value === 'pixels';
  showMessage();
  state.playing = true;
  updatePlayback();
  try {
    await audio.unlock();
    if (generation !== run) return;
    if (pixels && !scan) {
      await $('eic-image').decode();
      if (generation !== run) return;
      scan = extractFrameScan($('eic-image'));
      showScanNotes();
    }
    const score = pixels ? scanScore(scan.bands) : frameMode
      ? temperatureScore([byYear.get(state.frame)], 'global', '', 1)
      : temperatureScore(visibleObservations(), state.primary, state.comparison, state.rate);
    const offset = state.nextStep < score.length ? state.nextStep : 0;
    await audio.play(score.slice(offset), (id) => {
      if (generation !== run) return;
      state.nextStep = score.findIndex((step) => step.id === id) + 1;
      if (pixels) highlightScan(id);
      else if (frameMode) $('scan-status').textContent = `Global · ${format(byYear.get(id).values.global)} · ${Math.round(anomalyFrequency(byYear.get(id).values.global))} Hz`;
      else updateReading(id);
    }, () => {
      if (generation === run) stopPlayback();
    });
  } catch (error) {
    if (generation !== run) return;
    stopPlayback();
    showMessage(error instanceof Error ? error.message : 'Playback could not start.');
  }
}

function chooseTrack(id) {
  if (id === state.primary) return;
  stopPlayback();
  if (id === state.comparison) state.comparison = state.primary;
  state.primary = id;
  updateSelects();
  renderTimeline();
  updatePlayback();
}

function setMode(mode) {
  if (mode === state.mode) return;
  stopPlayback();
  showMessage();
  state.mode = mode;
  const frames = mode === 'frame';
  for (const id of ['globe-view', 'globe-controls', 'globe-legend']) $(id).hidden = frames;
  for (const id of ['frame-view', 'frame-controls']) $(id).hidden = !frames;
  $('mode-globe').setAttribute('aria-pressed', String(!frames));
  $('mode-frame').setAttribute('aria-pressed', String(frames));
  $('console').setAttribute('aria-labelledby', frames ? 'frame-title' : 'console-title');
  $('view-caption').textContent = frames ? 'NASA EARTH INFORMATION CENTER' : 'GISTEMP V4 / ANNUAL';
  document.querySelector('.timeline').hidden = frames;
  if (frames) selectFrame(state.frame);
  else renderTimeline();
  updatePlayback();
}

function selectFrame(year) {
  stopPlayback();
  showMessage();
  scan = null;
  $('scan-readings').open = false;
  $('frame-audio').value = 'pixels';
  showScanNotes();
  state.frame = year;
  const frame = eic.frames.find((entry) => entry.year === year);
  $('eic-image').src = asset(frame.image);
  $('eic-image').alt = frame.alt;
  $('frame-source').href = frame.sourceUrl;
  $('frame-description').textContent = frame.details;
  $('scan-status').textContent = 'Six stripes · North to south';
  for (const button of $('frame-picker').querySelectorAll('button')) button.setAttribute('aria-pressed', String(Number(button.dataset.year) === year));
  updatePlayback();
}

$('frame-picker').innerHTML = eic.frames.map(({ year }) => `<button type="button" data-year="${year}" aria-pressed="${year === state.frame}">${year}</button>`).join('');
$('catalog').href = 'https://svs.gsfc.nasa.gov/gallery/earth-information-center/';
$('data-provenance').innerHTML = `<p><strong>${source.title}</strong><br>${source.agency}<br>${first}–${last} · Calendar years · Snapshot ${source.accessed}</p><div class="source-actions"><a class="text-link" href="${source.landingUrl}" target="_blank" rel="noreferrer">NASA source ${icon('external', 16)}</a><a class="text-link" href="${asset('data/gistemp-zonal-annual.csv')}" download>Raw CSV ${icon('down', 16)}</a><a class="text-link" href="${source.citationUrl}" target="_blank" rel="noreferrer">Scientific citation ${icon('external', 16)}</a><a class="text-link" href="https://svs.gsfc.nasa.gov/4851/" target="_blank" rel="noreferrer">NASA star map ${icon('external', 16)}</a></div><p class="muted">NASA Scientific Visualization Studio maps. GISTEMP map data provided by Robert B. Schmunk (NASA/GSFC GISS). Blue Marble imagery courtesy of NASA Earth Observatory. Star field by NASA Goddard SVS, with Gaia DR2 data from ESA/Gaia/DPAC.</p>`;
$('insight-grid').innerHTML = insights.map(({ id, title, metric, description }) => `<article><span class="insight-metric mono">${metric}</span><h3>${title}</h3><p class="muted">${description}</p><button type="button" class="insight-link" data-insight="${id}">Explore this pattern ${icon('arrow', 18)}</button></article>`).join('');

$('mode-globe').onclick = () => setMode('globe');
$('mode-frame').onclick = () => setMode('frame');
$('zoom-in').onclick = () => globe.zoomBy(1.13);
$('zoom-out').onclick = () => globe.zoomBy(1 / 1.13);
$('reset-view').onclick = () => globe.reset();
$('play').onclick = playSelection;
$('restart').onclick = () => { stopPlayback(); playSelection(); };
$('volume').oninput = () => audio.setVolume(Number($('volume').value) / 100, state.muted);
$('mute').onclick = () => {
  state.muted = !state.muted;
  $('mute').setAttribute('aria-pressed', String(state.muted));
  $('mute').setAttribute('aria-label', state.muted ? 'Unmute' : 'Mute');
  $('mute').innerHTML = icon(state.muted ? 'mute' : 'speaker');
  $('volume').oninput();
};
$('eic-image').onerror = () => showMessage('This NASA frame could not load. The climate tracks remain available.');
$('primary').onchange = (event) => {
  chooseTrack(event.target.value);
  if (state.primary !== 'global') globe.focusBand(state.primary);
};
$('comparison').onchange = (event) => {
  stopPlayback();
  state.comparison = event.target.value;
  renderTimeline();
  updatePlayback();
};
$('year').oninput = (event) => { stopPlayback(); updateReading(Number(event.target.value)); };
$('chart').onclick = (event) => { stopPlayback(); updateReading(chart.yearAt(event.clientX)); };
$('table-details').ontoggle = () => {
  if ($('table-details').open) renderTable(visibleObservations(), [state.primary, state.comparison].filter(Boolean));
};
for (const [id, key] of [['from-year', 'from'], ['to-year', 'to']]) {
  $(id).onchange = (event) => {
    stopPlayback();
    const value = event.target.valueAsNumber;
    if (Number.isFinite(value)) state[key] = Math.max(first, Math.min(last, Math.round(value)));
    if (state.from > state.to) state[key === 'from' ? 'to' : 'from'] = state[key];
    state.year = Math.max(state.from, Math.min(state.to, state.year));
    updateRange();
    renderTimeline();
    updatePlayback();
  };
}
$('speed').onchange = (event) => { stopPlayback(); state.rate = Number(event.target.value); updatePlayback(); };
$('frame-picker').onclick = (event) => {
  const button = event.target.closest('button');
  if (button) selectFrame(Number(button.dataset.year));
};
$('frame-audio').onchange = () => {
  stopPlayback();
  $('scan-status').textContent = $('frame-audio').value === 'pixels' ? 'Six stripes · North to south' : 'NASA GISTEMP · Global annual anomaly';
  showScanNotes();
};

function applyInsight(insight) {
  setMode('globe');
  stopPlayback();
  [state.primary, state.comparison] = insight.series;
  state.from = insight.from;
  state.to = insight.to;
  state.year = insight.id === 'polar-split' ? 2016 : insight.id === 'recent-global' ? 2024 : insight.to;
  updateSelects();
  updateRange();
  renderTimeline();
  updatePlayback();
}

$('insight-grid').onclick = (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  applyInsight(insights.find(({ id }) => id === button.dataset.insight));
  $('observatory').focus({ preventScroll: true });
  $('observatory').scrollIntoView();
};

function showTourFrame() {
  setMode('frame');
  if (state.frame !== 2025) selectFrame(2025);
  $('frame-audio').value = 'pixels';
  $('frame-audio').onchange();
}

function showArcticComparison() {
  applyInsight(insights.find(({ id }) => id === 'arctic-shift'));
}

function visitSources() {
  $('method').focus({ preventScroll: true });
  $('method').scrollIntoView();
}

const guide = createGuide({
  observations,
  frame: eic.frames.find(({ year }) => year === 2025),
  onOpen: stopPlayback,
  onFrame: showTourFrame,
  onCompare: showArcticComparison,
  onSources: visitSources,
});

const tour = createTour({
  stopAudio: stopPlayback,
  showFrame: showTourFrame,
  playFrame: playSelection,
  showComparison: showArcticComparison,
  openEvidence: (trigger, resume, narrate) => guide.open(trigger, 1, resume, narrate),
  onActiveChange: (active) => pet.setTourActive(active),
});
const pet = createPet({ onTour: (trigger) => tour.open(trigger) });

document.querySelectorAll('[data-open-tour]').forEach((button) => {
  button.addEventListener('click', () => tour.open(button));
});

document.querySelectorAll('[data-open-guide]').forEach((button) => {
  button.addEventListener('click', () => guide.open(button));
});

updateSelects();
updateRange();
renderTimeline();
updatePlayback();

if (new URLSearchParams(location.search).get('view') === 'map') showTourFrame();

new ResizeObserver(() => {
  if (state.mode === 'globe') renderTimeline();
}).observe($('chart'));
