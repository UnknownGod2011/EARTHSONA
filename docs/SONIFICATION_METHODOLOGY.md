# Sonification methodology

EARTHSONA has two listening paths. **Climate tracks** render published annual anomaly values as notes. **NASA frames** turn the displayed map’s color patterns into a spatial scan. Both synthesize audio locally when the listener presses Play. [Data provenance](DATASET_RESEARCH.md) · [NASA EIC 2025 source map](https://svs.gsfc.nasa.gov/5603/)

## Climate tracks

| Input or control | Mapping |
| --- | --- |
| Annual land–ocean anomaly | One GISTEMP v4 observation per year in °C relative to that series’ 1951–1980 baseline. The bundled record spans 1880–2025. |
| Pitch | For anomaly `a` in °C, first calculate `c = clamp(a, −3.5, +3.5)`. The note is `220 × 2^(c/2)` Hz. The interval in cents is linear in the clipped value. Frequency in Hz is exponential. |
| Scaling | 0°C plays at 220 Hz. Every +2°C adds one octave. Both series and all ranges share these constants. Values beyond ±3.5°C sound at the nearest endpoint, and charts and readings keep the source values. |
| Time | Each year occupies the same interval. The 2, 4, and 8 years-per-second settings change pacing and envelope duration while preserving pitch. |
| Two tracks | Primary uses sine and starts at the beginning of the year interval. Comparison uses triangle and starts 43% into the interval. Supported browsers pan them slightly left and right respectively. Both remain distinct in mono through timing and timbre. |
| Missing values | The source snapshot has no gaps in the selected columns. A nonfinite value reaching the audio engine maps to silence. No interpolation is added by the audio engine. |

Examples with the shared mapping:

| Annual value | Frequency |
| --- | ---: |
| −2.00°C | 110.0 Hz |
| 0.00°C | 220.0 Hz |
| +1.00°C | 311.1 Hz |
| +2.00°C | 440.0 Hz |
| +3.50°C | 740.0 Hz |

A 1°C separation gives a six-semitone pitch separation until a value clips. The tones are designed auditory encodings. Zone values are longitudes aggregated across a selected latitude band, and each zone’s anomaly uses its own corresponding reference climate. See the table or chart for exact values. [Pitch and score implementation](../src/sonification.js) · [NASA GISS methodology](https://data.giss.nasa.gov/gistemp/)

## NASA frames

The selected 2023, 2024 or 2025 EIC map is decoded at its native dimensions. The scanner checks for expected red and blue legend points, then walks six approximate Robinson latitude stripes from north to south. At the 1920 × 1080 layout size it samples every four pixels horizontally and vertically. The archived 1024 × 576 image uses the scaled geometry and lattice spacing. The image files and their hashes are pinned. [Scanner implementation](../src/frame-scan.js) · [Frame metadata](../src/data/eic.json)

The scanner excludes dark margins and strokes, nonopaque pixels, near-gray pixels, and pixels whose green channel is more than eight channel levels outside the red–blue interval. Its archived layout masks the lower-left legend inset and the row bounds exclude the labels and timeline. Remaining map boundary antialiasing, palette differences, compression, or visible features may influence the sample summaries.

For each remaining pixel, let `d = R − B` in 8-bit channel levels. The computed warm, cool, and neutral shares use `d ≥ 12`, `d ≤ −12`, and the interval between those thresholds. The pitch uses the mean of `clamp(d/128, −1, +1)` across valid samples. If that color balance is `b`, a stripe plays `220 × 2^b` Hz for one audio interval of 0.55 seconds. Red-dominant stripes generally play higher, blue-dominant stripes lower, and an empty stripe is silent. The highlight tracks the stripe being heard. For example, a balance of −0.50 plays about 155.6 Hz, while +0.50 plays about 311.1 Hz.

These counts summarize sampled pixels on a rendered, non-equal-area projection. The colors and map layouts differ across the three NASA releases and the scan uses thresholds rather than inverting the NASA color scales. Use the scan to hear relative encoded color across a single map. Use the common-scale climate tracks to compare temperature magnitudes across regions and years.

The frame interface also offers **GISTEMP annual reading**. It plays the matching year’s published global index as a single note using the same temperature formula as Climate tracks. The display identifies the selected source.

## Luma’s guided comparison

The first guide step uses the same pixel scan on NASA SVS #5603. The second takes the arithmetic mean of the ten published annual values in each selected window, 1980–1989 and 2016–2025, for the Arctic band and the global record. It applies the numeric mapping to each unrounded mean. Each pair plays Arctic first, then global, using the same sine wave, duration, output gain and centered pan. A brief pause separates the windows. The reveal rounds the measured changes only for display and links directly to the source table. [Underlying values and calculations](DISCOVERED_INSIGHTS.md) · [Guide implementation](../src/guide.js)

## Playback and reproducibility

Score construction is deterministic from the selected input and settings. Web Audio schedules sine or triangle oscillators from its audio clock, shapes each note with a short attack and decay, and applies the shared volume and mute settings. Visual steps follow the same timestamps. The player may skip scheduled notes after a long timer delay in a background tab. Synthesizer output can vary slightly by browser audio sampling and speaker setup. For the frame scan, a browser’s image color management and decoding can affect the processed channel values. Listening relies primarily on pitch, with two-track contrast also signaled by onset and oscillator type.

`node --test tests/frame-scan.test.js` verifies geometry, legend detection, masking, and mapping polarity. The production assets can be inspected and downloaded from NASA, and `node scripts/build-climate.mjs --check` verifies the derived annual bundle against the pinned source CSV. [Architecture](ARCHITECTURE.md) · [Testing](TESTING.md)
