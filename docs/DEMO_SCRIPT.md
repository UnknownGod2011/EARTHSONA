# EARTHSONA demo

[Watch the public demo](https://unknowngod2011.github.io/EARTHSONA/demo/) · [Direct MP4](https://unknowngod2011.github.io/EARTHSONA/demo/earthsona.mp4)

The 29.70-second cut introduces Tanush Shah and Yaksh Dharod and gives the scientific audio its own space. It uses English captions, browser footage, data overlays, and the team’s opening GIF. Pitch-preserving tempo changes apply only to the brief ElevenLabs narration. The project took on the Earth Information Jukebox challenge for NASA Space Apps 2026.

| Time | What the viewer sees and hears |
| --- | --- |
| 0.00–2.10 | Tanush Shah and Yaksh Dharod introduce Team EARTHSONA in the team’s waving GIF. |
| 2.10–4.30 | “What does warming sound like?” over the turning EARTHSONA globe. |
| 4.30–8.90 | Six scan bands on the 2025 NASA Earth Information Center map connect to their pitches. The six app notes play at native pitch and spacing. |
| 8.90–13.13 | Two Arctic/global pairs use one pitch scale. The 1980–1989 notes nearly coincide. In 2016–2025 their pitches are farther apart. |
| 13.13–20.67 | The live globe and timeline play 14 annual Arctic and Antarctic pairs from 2012–2025 at two years per second. The active year and readings track the notes. |
| 20.67–25.60 | Return to the Arctic/global comparison. Mean anomaly rose **2.38°C in the Arctic band** and **0.77°C globally** between the two ten-year windows. Both series use the 1951–1980 baseline. |
| 25.60–29.70 | The closing globe and public URL invite viewers to open the site and play the NASA map. |

## Sources and editing

The 2025 map comes from the [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/5603/). Both numeric comparisons come from [NASA GISS GISTEMP v4](https://data.giss.nasa.gov/gistemp/). The [methods](SONIFICATION_METHODOLOGY.md) describe how each input maps to pitch. The map insert uses the official frame with synchronized editorial versions of the browser’s scan highlight and pitch readout. The sound comes from the app’s deterministic Web Audio mapping.

OpenAI Codex assisted the edit and graphics. The team supplied the opening GIF, which carries a visible AI-media watermark. The hosted video description and MP4 metadata credit the ElevenLabs narration. [Space Apps demo guidance](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo) · [ElevenLabs publication rules](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)

## Capture new raw app footage

Start Vite on port 4174. Use a current Chrome or Playwright Chromium and FFmpeg with AAC, libx264, and libass. Run the browser capture script and supply a separate output path. This produces a fresh walkthrough recording for editing.

```sh
node scripts/record-demo.mjs earthsona-walkthrough.mp4
```

Set `EARTHSONA_CHROME` to the Chrome executable if needed and `EARTHSONA_URL` to capture a different running build. The script records the actual Web Audio and leaves the underlying audio and captions in the printed temporary folder.
