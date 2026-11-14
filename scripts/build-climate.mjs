import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const rawPath = new URL('../public/data/gistemp-zonal-annual.csv', import.meta.url);
const generatedPath = new URL('../src/data/climate.json', import.meta.url);
const eicPath = new URL('../src/data/eic.json', import.meta.url);
const sourceMetadata = {
  title: 'GISS Surface Temperature Analysis (GISTEMP v4)',
  agency: 'NASA Goddard Institute for Space Studies',
  product: 'Annual Land–Ocean Temperature Index (L-OTI)',
  landingUrl: 'https://data.giss.nasa.gov/gistemp/',
  downloadUrl: 'https://data.giss.nasa.gov/gistemp/tabledata_v4/ZonAnn.Ts+dSST.csv',
  citationUrl: 'https://doi.org/10.1029/2023JD040179',
  accessed: '2026-11-14',
  baseline: '1951–1980',
  units: '°C',
};

const header = 'Year,Glob,NHem,SHem,24N-90N,24S-24N,90S-24S,64N-90N,44N-64N,24N-44N,EQU-24N,24S-EQU,44S-24S,64S-44S,90S-64S';
const series = [
  { id: 'global', label: 'Global mean', shortLabel: 'Global', minLatitude: -90, maxLatitude: 90, column: 'Glob' },
  { id: 'arctic', label: 'Arctic band · 64–90°N', shortLabel: 'Arctic', minLatitude: 64.2, maxLatitude: 90, column: '64N-90N' },
  { id: 'north-mid', label: '44–64°N', shortLabel: '44–64°N', minLatitude: 44.4, maxLatitude: 64.2, column: '44N-64N' },
  { id: 'north-subtropical', label: '24–44°N', shortLabel: '24–44°N', minLatitude: 23.6, maxLatitude: 44.4, column: '24N-44N' },
  { id: 'north-tropical', label: '0–24°N', shortLabel: '0–24°N', minLatitude: 0, maxLatitude: 23.6, column: 'EQU-24N' },
  { id: 'south-tropical', label: '0–24°S', shortLabel: '0–24°S', minLatitude: -23.6, maxLatitude: 0, column: '24S-EQU' },
  { id: 'south-subtropical', label: '24–44°S', shortLabel: '24–44°S', minLatitude: -44.4, maxLatitude: -23.6, column: '44S-24S' },
  { id: 'south-mid', label: '44–64°S', shortLabel: '44–64°S', minLatitude: -64.2, maxLatitude: -44.4, column: '64S-44S' },
  { id: 'antarctic', label: 'Antarctic band · 64–90°S', shortLabel: 'Antarctic', minLatitude: -90, maxLatitude: -64.2, column: '90S-64S' },
];

function parseSnapshot(raw) {
  const [firstLine, ...rows] = raw.toString('utf8').trimEnd().split(/\r?\n/);
  if (firstLine !== header || rows.length === 0) {
    throw new Error('Expected the NASA GISTEMP v4 zonal annual table and its published CSV header.');
  }

  const columns = header.split(',');
  return rows.map((line, index) => {
    const cells = line.split(',');
    const year = 1880 + index;
    if (cells[0] !== String(year) || cells.length !== columns.length) {
      throw new Error(`Expected a complete in-order CSV row for year ${year}.`);
    }

    const values = {};
    for (const { id, column } of series) {
      const cell = cells[columns.indexOf(column)];
      if (!/^[+-]?\d*\.\d{2}$/.test(cell)) {
        throw new Error(`GISTEMP ${year} ${column} is missing or malformed: ${JSON.stringify(cell)}.`);
      }
      const value = Number(cell);
      if (!Number.isFinite(value) || Math.abs(value) > 10) {
        throw new Error(`Inspect the unexpected anomaly in GISTEMP ${year} ${column}: ${cell}.`);
      }
      values[id] = value;
    }
    return { year, values };
  });
}

function calculateInsights(observations) {
  const byYear = new Map(observations.map(({ year, values }) => [year, values]));

  function mean(id, from, to) {
    let sum = 0;
    for (let year = from; year <= to; year += 1) {
      sum += byYear.get(year)[id];
    }
    return sum / (to - from + 1);
  }

  const arcticChange = mean('arctic', 2016, 2025) - mean('arctic', 1980, 1989);
  const globalChange = mean('global', 2016, 2025) - mean('global', 1980, 1989);
  const polar = byYear.get(2016);
  const format = (value) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}°C`;

  return [
    {
      id: 'polar-split',
      title: 'The poles sound different',
      description: `In 2016 the Arctic band was ${format(polar.arctic)} relative to its baseline. The Antarctic band was ${format(polar.antarctic)}. Listen as the interval between them changes.`,
      metric: `${(polar.arctic - polar.antarctic).toFixed(2)}°C gap in 2016`,
      series: ['arctic', 'antarctic'],
      from: 2014,
      to: 2025,
    },
    {
      id: 'arctic-shift',
      title: 'A larger shift in the Arctic',
      description: `From the 1980s to 2016–2025, the Arctic band’s decade mean rose ${format(arcticChange)}. The global mean rose ${format(globalChange)} over the same windows.`,
      metric: `${format(arcticChange)} Arctic · ${format(globalChange)} global`,
      series: ['arctic', 'global'],
      from: 1980,
      to: 2025,
    },
    {
      id: 'recent-global',
      title: 'Three unusually warm years',
      description: `The global annual estimates for 2023, 2024 and 2025 are ${format(byYear.get(2023).global)}, ${format(byYear.get(2024).global)} and ${format(byYear.get(2025).global)}. NASA describes 2023 and 2025 as effectively tied within uncertainty.`,
      metric: `${format(byYear.get(2024).global)} global in 2024`,
      series: ['global', 'arctic'],
      from: 2023,
      to: 2025,
    },
  ];
}

const args = process.argv.slice(2);
const check = args[0] === '--check';
if (args.length > Number(check)) {
  throw new Error('Usage: node scripts/build-climate.mjs [--check]');
}

const raw = await readFile(rawPath);
const observations = parseSnapshot(raw);
const lastYear = observations.at(-1).year;
if (lastYear < 2025) {
  throw new Error(`This snapshot must include all years through 2025, but ends at ${lastYear}.`);
}

const eic = JSON.parse(await readFile(eicPath, 'utf8'));
const eicYears = new Set();
for (const frame of eic.frames) {
  if (eicYears.has(frame.year) || !observations.some(({ year }) => year === frame.year)) {
    throw new Error(`No unique corresponding annual anomaly row for EIC frame ${frame.year}.`);
  }
  eicYears.add(frame.year);
  const image = await readFile(new URL(`../public/${frame.image}`, import.meta.url));
  if (createHash('sha256').update(image).digest('hex') !== frame.sha256) {
    throw new Error(`Official EIC frame checksum mismatch: ${frame.image}.`);
  }
}

const snapshot = {
  source: {
    ...sourceMetadata,
    sha256: createHash('sha256').update(raw).digest('hex'),
    years: { first: observations[0].year, last: lastYear },
  },
  series,
  observations,
  insights: calculateInsights(observations),
};
const generated = `${JSON.stringify(snapshot, null, 2)}\n`;

if (!check) {
  await writeFile(generatedPath, generated, 'utf8');
} else if ((await readFile(generatedPath, 'utf8')).replaceAll('\r\n', '\n') !== generated) {
  throw new Error('Generated climate data drifted. Run node scripts/build-climate.mjs and review the diff.');
}
console.log(`Validated ${observations.length} annual rows, ${series.length} series and ${eicYears.size} EIC images.`);
