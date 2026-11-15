import assert from 'node:assert/strict';
import test from 'node:test';
import { Player, anomalyFrequency, temperatureScore, scanScore } from '../src/sonification.js';

test('sonification starts at full master volume and remains adjustable', () => {
  const player = new Player();
  assert.equal(player.volume, 1);
  assert.equal(player.muted, false);
  player.setVolume(0.5, true);
  assert.equal(player.volume, 0.5);
  assert.equal(player.muted, true);
});

test('temperature differences correspond to one shared pitch scale', () => {
  assert.equal(anomalyFrequency(0), 220);
  assert.equal(anomalyFrequency(-2), 110);
  assert.equal(anomalyFrequency(2), 440);
  assert.equal(anomalyFrequency(null), null);
  assert.equal(anomalyFrequency(8), anomalyFrequency(3.5));
  assert.equal(anomalyFrequency(-8), anomalyFrequency(-3.5));
});

test('temporal speed leaves note pitch and missing values intact', () => {
  const observation = [{ year: 2024, values: { a: 2, b: null } }];
  const [first] = temperatureScore(observation, 'a', 'b', 2);
  const [second] = temperatureScore(observation, 'a', 'b', 8);
  assert.equal(first.id, 2024);
  assert.equal(first.duration, second.duration * 4);
  assert.equal(first.notes[0].frequency, second.notes[0].frequency);
  assert.equal(first.notes[1].frequency, null);
  assert.ok(first.notes[1].offset > 0);
  assert.equal(temperatureScore(observation, 'a', '', 2)[0].notes.length, 1);
});

test('frame notes preserve scan ordering and calibrated frequency', () => {
  const bands = [{ id: 'north', frequency: 329 }, { id: 'south', frequency: 281 }];
  const score = scanScore(bands);
  assert.deepEqual(score.map((step) => [step.id, step.notes[0].frequency]), [['north', 329], ['south', 281]]);
  assert.equal(score[0].duration, 0.55);
});
