const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 1080;
const SAMPLE_SPACING = 4;
const NEUTRAL_THRESHOLD = 12;
const COLOR_SCALE = 128;
const CENTER_FREQUENCY = 220;

// Native coordinates on a 1920 × 1080 reference layout. The older frames share
// a layout and have a vertical legend in the lower-left corner.
const LAYOUTS = {
  current: {
    rows: [115, 224, 375, 530, 684, 836, 944],
    left: 118,
    right: 1761,
    blueLegend: [820, 1013],
    redLegend: [1120, 1013],
  },
  older: {
    rows: [13, 134, 305, 487, 664, 832, 960],
    left: 24,
    right: 1897,
    blueLegend: [78, 1018],
    redLegend: [78, 800],
    legendInset: { bottomRows: 776, right: 132 },
  },
};

const BANDS = [
  { id: 'north-polar', label: 'Far north', startLatitude: 90, endLatitude: 60 },
  { id: 'north-mid', label: 'Northern midlatitudes', startLatitude: 60, endLatitude: 30 },
  { id: 'north-tropical', label: 'Northern tropics', startLatitude: 30, endLatitude: 0 },
  { id: 'south-tropical', label: 'Southern tropics', startLatitude: 0, endLatitude: -30 },
  { id: 'south-mid', label: 'Southern midlatitudes', startLatitude: -30, endLatitude: -60 },
  { id: 'south-polar', label: 'Far south', startLatitude: -60, endLatitude: -90 },
];

export function scanFramePixels({ data, width, height }) {
  const supported = (width === 1920 && height === 1080) || (width === 1024 && height === 576);
  if (!supported || data.length !== width * height * 4) {
    throw new Error('The frame scan requires a supported NASA SVS map layout.');
  }

  const pixelX = (x) => Math.round((x / REFERENCE_WIDTH) * width);
  const pixelY = (y) => Math.round((y / REFERENCE_HEIGHT) * height);
  const legendDifference = ([x, y]) => {
    const offset = (pixelY(y) * width + pixelX(x)) * 4;
    return data[offset] - data[offset + 2];
  };
  const layout = Object.values(LAYOUTS).find(({ blueLegend, redLegend }) => (
    legendDifference(blueLegend) < -50 && legendDifference(redLegend) > 50
  ));
  if (!layout) throw new Error('The frame scan could not identify the red and blue map legend.');

  const rows = layout.rows.map(pixelY);
  const spacing = Math.max(1, pixelX(SAMPLE_SPACING));
  const left = pixelX(layout.left);
  const right = pixelX(layout.right);
  const inset = layout.legendInset;
  const insetX = inset ? pixelX(inset.right) : left;
  const insetY = inset ? pixelY(inset.bottomRows) : height;
  const bands = BANDS.map((band, index) => {
    let warm = 0;
    let cool = 0;
    let neutral = 0;
    let colorSum = 0;

    for (let y = rows[index] + Math.max(1, pixelY(2)); y < rows[index + 1]; y += spacing) {
      const rowLeft = y >= insetY ? insetX : left;
      for (let x = rowLeft; x < right; x += spacing) {
        const offset = (y * width + x) * 4;
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        const brightest = Math.max(red, green, blue);
        const darkest = Math.min(red, green, blue);

        // Discard blank margins, dark boundary strokes and near-gray pixels.
        if (data[offset + 3] !== 255 || brightest < 36 || brightest - darkest <= 2) continue;
        if (green < Math.min(red, blue) - 8 || green > Math.max(red, blue) + 8) continue;

        const difference = red - blue;
        if (difference >= NEUTRAL_THRESHOLD) warm += 1;
        else if (difference <= -NEUTRAL_THRESHOLD) cool += 1;
        else neutral += 1;
        colorSum += Math.max(-1, Math.min(1, difference / COLOR_SCALE));
      }
    }

    const samples = warm + cool + neutral;
    const balance = samples > 0 ? colorSum / samples : null;
    return {
      ...band,
      warm: samples > 0 ? warm / samples : null,
      cool: samples > 0 ? cool / samples : null,
      neutral: samples > 0 ? neutral / samples : null,
      samples,
      balance,
      frequency: balance === null ? null : CENTER_FREQUENCY * 2 ** balance,
      y: rows[index] / height,
      height: (rows[index + 1] - rows[index]) / height,
    };
  });

  return { bands, sourceWidth: width, sourceHeight: height };
}

export function extractFrameScan(image) {
  const { naturalWidth: width, naturalHeight: height } = image;
  if (!image.complete || !width || !height) throw new Error('The NASA frame is still loading.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('This browser could not read the NASA frame.');
  context.drawImage(image, 0, 0);
  return scanFramePixels(context.getImageData(0, 0, width, height));
}
