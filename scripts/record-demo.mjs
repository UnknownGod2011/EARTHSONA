import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { chromium } from 'playwright';

const address = process.env.EARTHSONA_URL || 'http://127.0.0.1:4174/';
const output = resolve(process.argv[2] || join(tmpdir(), 'earthsona-demo.mp4'));
const work = await mkdtemp(join(tmpdir(), 'earthsona-recording-'));
const size = { width: 1600, height: 800 };
const fps = 30;
const seconds = 29.6;
const frames = [];
const cues = [];
let start = 0;

function captureWebAudio() {
  const connect = AudioNode.prototype.connect;
  const capture = { recordings: [], current: null };
  window.earthsonaRecording = capture;

  function record() {
    const source = capture.source;
    if (!source || capture.current) return;
    const destination = source.context.createMediaStreamDestination();
    connect.call(source, destination);
    const recorder = new MediaRecorder(destination.stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 192000,
    });
    const chunks = [];
    const completed = new Promise((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        resolve(Array.from(new Uint8Array(await blob.arrayBuffer())));
      };
    });
    capture.current = {
      started: Date.now(),
      finish: () => { recorder.stop(); return completed; },
    };
    recorder.start();
  }

  AudioNode.prototype.connect = function (target, ...options) {
    const connection = connect.call(this, target, ...options);
    if (target === this.context?.destination) {
      capture.source = this;
      record();
    }
    return connection;
  };

  capture.begin = record;
  capture.end = async () => {
    const recording = capture.current;
    if (!recording) throw new Error('Web Audio did not start a capture.');
    capture.current = null;
    capture.recordings.push({ started: recording.started, bytes: await recording.finish() });
  };
  localStorage.setItem('earthsona.theme', 'dark');
}

function cue(label, line) {
  cues.push({ time: (Date.now() - start) / 1000, label, line });
}

function at(time) {
  return wait(Math.max(0, start + time * 1000 - Date.now()));
}

const browser = await chromium.launch({ executablePath: process.env.EARTHSONA_CHROME || undefined });
let recordings;
try {
  const page = await browser.newPage({ viewport: size });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.addInitScript(captureWebAudio);
  await page.screencast.start({ size, fps, quality: 87, onFrame: (frame) => frames.push(frame) });
  await page.goto(address, { waitUntil: 'domcontentloaded' });
  await page.locator('#hero-title').waitFor({ state: 'attached' });
  await page.locator('.hero h1').evaluate((heading) => document.fonts.load(`400 ${getComputedStyle(heading).fontSize} ${getComputedStyle(heading).fontFamily}`));
  start = Date.now();
  cues.push({ time: 0, label: 'EARTHSONA · THE EARTH INFORMATION JUKEBOX', line: 'What does a NASA warming map sound like?' });

  await at(2.5);
  await page.locator('#start-guide').click();
  const guide = page.locator('#luma-guide');
  await guide.waitFor();
  const notes = guide.locator('#guide-listen');
  const next = guide.locator('#guide-next');
  await guide.locator('img').evaluateAll((images) => Promise.all(images.map((img) => img.decode().catch(() => {}))));
  cue('01 / NASA EARTH INFORMATION CENTER · 2025', 'Six tones read the actual map colors, north to south.');
  await at(3.4);
  await notes.click();
  await guide.locator('.guide-frame-beam').waitFor({ state: 'visible' });

  await at(7.65);
  await page.evaluate(() => window.earthsonaRecording.end());
  await next.click();
  cue('02 / NASA GISTEMP V4 · ARCTIC VS. GLOBAL', 'Which ten-year period sounds farther apart?');
  await at(9.05);
  await page.evaluate(() => window.earthsonaRecording.begin());
  await notes.click();
  await guide.locator('.guide-tone[data-active="true"]').waitFor({ state: 'visible' });

  await at(13.5);
  await page.evaluate(() => window.earthsonaRecording.end());
  await next.click();
  await guide.locator('#guide-evidence').waitFor({ state: 'visible' });
  cue('03 / TWO TEN-YEAR WINDOWS · ANNUAL ANOMALIES', 'Arctic band: +2.38°C shift. Global mean: +0.77°C.');

  await at(19.1);
  await guide.locator('#guide-sources').click();
  cue('04 / CHECK THE SOURCE', 'Read the numbers and NASA’s 1951–1980 reference period.');

  await at(24);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  cue('EARTHSONA · NASA SPACE APPS 2026 · UNKNOWNGOD2011', 'Try the guided listen at unknowngod2011.github.io/EARTHSONA');
  await at(seconds + 0.1);

  recordings = await page.evaluate(() => window.earthsonaRecording.recordings);
  await page.screencast.stop();
  if (errors.length) throw new AggregateError(errors, 'Browser recording had page errors.');
} finally {
  await browser.close();
}

if (!frames.length || !recordings.length) {
  throw new Error(`The browser captured ${frames.length} video frames and ${recordings.length} audio tracks.`);
}

function assTime(time) {
  const centiseconds = Math.max(0, Math.round(time * 100));
  const minutes = Math.floor(centiseconds / 6000);
  const remainder = centiseconds % 6000;
  return `0:${String(minutes).padStart(2, '0')}:${(remainder / 100).toFixed(2).padStart(5, '0')}`;
}

const subtitle = `[Script Info]
Title: EARTHSONA judging demo
ScriptType: v4.00+
PlayResX: 1600
PlayResY: 900
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Label,Segoe UI,20,&H00F4C8B5,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,1,0,0,7,0,0,0,1
Style: Line,Segoe UI,36,&H00FAF5F3,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${cues.map(({ time, label, line }, index) => {
    const timing = `${assTime(time)},${assTime(cues[index + 1]?.time ?? seconds)}`;
    return `Dialogue: 0,${timing},Label,,0,0,0,,{\\pos(52,816)}${label}\nDialogue: 0,${timing},Line,,0,0,0,,{\\pos(52,842)}${line}`;
  }).join('\n')}
`;

await writeFile(join(work, 'captions.ass'), subtitle);
const audioInputs = [];
const audioStreams = [];
for (const [index, { bytes, started }] of recordings.entries()) {
  const name = `audio-${index}.webm`;
  await writeFile(join(work, name), Buffer.from(bytes));
  audioInputs.push('-i', name);
  audioStreams.push(`[${index + 1}:a]aresample=async=1:first_pts=0,adelay=${Math.round(started - start)}:all=1,apad[a${index}]`);
}
const audioFilter = `${audioStreams.join(';')};${recordings.map((_, index) => `[a${index}]`).join('')}amix=inputs=${recordings.length}:normalize=0,volume=3dB,alimiter=limit=0.87[audio]`;
const videoFilter = 'pad=1600:900:0:0:0x13111F,drawbox=x=0:y=800:w=1600:h=1:color=0x645298:t=fill,ass=captions.ass';
const encode = spawn(process.env.EARTHSONA_FFMPEG || 'ffmpeg', [
  '-hide_banner', '-loglevel', 'warning', '-y',
  '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0',
  ...audioInputs,
  '-filter_complex', audioFilter, '-map', '0:v:0', '-map', '[audio]', '-vf', videoFilter,
  '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(seconds),
  '-movflags', '+faststart+use_metadata_tags',
  '-metadata', 'title=EARTHSONA | NASA Space Apps Challenge 2026',
  '-metadata', 'comment=Real EARTHSONA browser capture and actual deterministic Web Audio. OpenAI Codex assisted project implementation, Luma art and video editing. NASA data: Earth Information Center SVS #5603 and NASA GISS GISTEMP v4.',
  output,
], { cwd: work, stdio: ['pipe', 'inherit', 'inherit'] });
const done = once(encode, 'exit');
let frame = 0;
for (let i = 0; i < seconds * fps; i++) {
  const timestamp = start + (i / fps) * 1000;
  while (frames[frame + 1]?.timestamp <= timestamp) frame++;
  if (!encode.stdin.write(frames[frame].data)) await once(encode.stdin, 'drain');
}
encode.stdin.end();
const [result] = await done;
if (result !== 0) throw new Error(`FFmpeg exited with status ${result}`);

console.log(`Saved ${seconds}s at ${output}\nRaw audio and captions at ${work}`);
for (const { time, label } of cues) console.log(`${time.toFixed(2)}s ${label}`);
