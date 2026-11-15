export const MAX_ANOMALY = 3.5;
export const REFERENCE_HZ = 220;
export const DEFAULT_VOLUME = 1;

export function anomalyFrequency(anomaly) {
  if (!Number.isFinite(anomaly)) return null;
  const clipped = Math.min(MAX_ANOMALY, Math.max(-MAX_ANOMALY, anomaly));
  return REFERENCE_HZ * 2 ** (clipped / 2);
}

export function temperatureScore(observations, primary, comparison, rate) {
  const seconds = 1 / rate;
  return observations.map(({ year, values }) => ({
    id: year,
    duration: seconds,
    notes: [
      { frequency: anomalyFrequency(values[primary]), pan: comparison ? -0.42 : 0, offset: 0, wave: 'sine' },
      ...(comparison ? [
        { frequency: anomalyFrequency(values[comparison]), pan: 0.42, offset: seconds * 0.43, wave: 'triangle' },
      ] : []),
    ],
  }));
}

export function scanScore(bands) {
  return bands.map(({ id, frequency }) => ({
    id,
    duration: 0.55,
    notes: [{ frequency, offset: 0, pan: 0, wave: 'sine' }],
  }));
}

export function scheduleNote(context, destination, note, startTime, duration) {
  if (!Number.isFinite(note.frequency) || note.frequency <= 0) return [];
  const start = startTime + note.offset;
  const length = Math.min(0.42, (duration - note.offset) * 0.94);
  const attack = Math.min(0.026, length * 0.25);
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = note.wave;
  oscillator.frequency.value = note.frequency;
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(note.wave === 'triangle' ? 0.14 : 0.21, start + attack);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + length * 0.83);
  envelope.gain.linearRampToValueAtTime(0, start + length);
  oscillator.connect(envelope);
  const panner = context.createStereoPanner?.();
  if (panner) {
    panner.pan.value = note.pan;
    envelope.connect(panner).connect(destination);
  } else {
    envelope.connect(destination);
  }
  oscillator.start(start);
  oscillator.stop(start + length + 0.006);
  return [oscillator, envelope, panner].filter(Boolean);
}

export class Player {
  constructor() {
    this.volume = DEFAULT_VOLUME;
    this.muted = false;
    this.generation = 0;
    this.active = [];
  }

  setVolume(volume, muted) {
    this.volume = volume;
    this.muted = muted;
    if (this.output) this.output.gain.setTargetAtTime(muted ? 0 : volume, this.context.currentTime, 0.015);
  }

  unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('This browser does not support Web Audio. You can still inspect the data and frames.');
    if (!this.context) {
      this.context = new Audio();
      this.output = this.context.createGain();
      this.output.gain.value = this.muted ? 0 : this.volume;
      this.output.connect(this.context.destination);
    }
    return this.context.resume();
  }

  async play(score, onStep, onEnd) {
    this.stop();
    const generation = this.generation;
    if (!score.length) return;
    await this.unlock();
    if (generation !== this.generation) return;
    const bus = this.context.createGain();
    bus.connect(this.output);
    const start = this.context.currentTime + 0.045;
    let cursor = start;
    const steps = score.map((step) => {
      const time = cursor;
      cursor += step.duration;
      return { ...step, time };
    });
    let scheduled = 0;
    let displayed = -1;
    this.active = [bus];
    const tick = () => {
      const now = this.context.currentTime;
      while (scheduled < steps.length && steps[scheduled].time < now + 0.16) {
        const step = steps[scheduled++];
        if (now > step.time + 0.08) continue;
        for (const note of step.notes) {
          const nodes = scheduleNote(this.context, bus, note, Math.max(now, step.time), step.duration);
          if (!nodes.length) continue;
          this.active.push(...nodes);
          nodes[0].onended = () => {
            for (const node of nodes) node.disconnect();
            this.active = this.active.filter((node) => !nodes.includes(node));
          };
        }
      }
      let next = displayed;
      while (next + 1 < steps.length && steps[next + 1].time <= now) next++;
      if (next !== displayed) {
        displayed = next;
        onStep(steps[displayed].id);
      }
      if (now >= cursor) {
        this.stop();
        onEnd();
      }
    };
    this.timer = setInterval(tick, 24);
    tick();
  }

  stop() {
    this.generation++;
    clearInterval(this.timer);
    for (const node of this.active) {
      if (typeof node.stop === 'function') node.stop();
      node.disconnect();
    }
    this.active = [];
  }
}
