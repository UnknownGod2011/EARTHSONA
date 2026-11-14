# EARTHSONA demo

[Watch the public demo](https://unknowngod2011.github.io/EARTHSONA/demo/) · [Direct MP4](https://unknowngod2011.github.io/EARTHSONA/demo/earthsona.mp4)

The 29.70-second cut introduces Tanush Shah and Yaksh Dharod, shows the running project, and gives the scientific audio its own space. It uses English captions, real browser footage, original scopes and overlays, and the team’s opening GIF. Pitch-preserving tempo changes apply only to the brief ElevenLabs narration. The project took on the Earth Information Jukebox challenge for NASA Space Apps 2026.

| Time | What the viewer sees and hears |
| --- | --- |
| 0.00–2.10 | Tanush Shah and Yaksh Dharod introduce Team EARTHSONA in the team’s waving GIF. |
| 2.10–5.00 | “What does warming sound like?” over the turning EARTHSONA globe. |
| 5.00–8.00 | The title and running observatory show where viewers can explore the globe, play maps, and compare climate records. |
| 8.00–12.60 | Six scan bands on the 2025 NASA Earth Information Center map connect to their pitches. The six actual app notes play at native pitch and spacing. |
| 12.60–17.50 | Two Arctic/global pairs use one pitch scale. The 1980–1989 notes nearly coincide. In 2016–2025 their pitches are farther apart. |
| 17.50–23.10 | The two-window shifts appear beside the app’s evidence table. Mean anomaly rose **2.38°C in the Arctic band** and **0.77°C globally**. Both series use the 1951–1980 baseline. |
| 23.10–26.20 | The real Luma tour shows how a viewer gets started. |
| 26.20–29.70 | The closing globe and public URL invite viewers to try the jukebox and explore the data. |

## Sources and editing

The 2025 map comes from the [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/5603/). The comparison comes from [NASA GISS GISTEMP v4](https://data.giss.nasa.gov/gistemp/). The [methods](SONIFICATION_METHODOLOGY.md) describe how each input maps to pitch. The map insert uses the official frame with synchronized editorial versions of the browser’s scan highlight and pitch readout. The sound comes from recordings of the browser’s deterministic Web Audio engine.

OpenAI Codex assisted the edit and graphics. The video credits the AI-assisted Luma artwork and identifies ElevenLabs narration in both descriptive text and the MP4’s metadata. The team supplied the opening GIF. [Space Apps demo guidance](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo) · [ElevenLabs publication rules](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)

## Capture new raw app footage

Start Vite on port 4174. Use a current Chrome or Playwright Chromium and FFmpeg with AAC, libx264, and libass. Run the browser capture script and supply a separate output path. This produces a fresh walkthrough recording for editing.

```sh
node scripts/record-demo.mjs earthsona-walkthrough.mp4
```

Set `EARTHSONA_CHROME` to the Chrome executable if needed and `EARTHSONA_URL` to capture a different running build. The script records the actual Web Audio and leaves the underlying audio and captions in the printed temporary folder.
