# EARTHSONA demo

[Watch the team’s NASA Space Apps demo on YouTube](https://www.youtube.com/watch?v=6VNh-8TCNbA) · [Hosted demo copy](https://earthsona.vercel.app/demo/) · [Direct MP4](https://earthsona.vercel.app/demo/earthsona.mp4)

Tanush Shah and Yaksh Dharod selected the published cut. The website serves the team’s original MP4 and links to their YouTube upload. The [listening observatory](https://earthsona.vercel.app/?view=map#observatory) opens directly on the 2025 NASA map.

The app reads map pixels from [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/5603/) and numeric anomalies from [NASA GISS GISTEMP v4](https://data.giss.nasa.gov/gistemp/). The [methods](SONIFICATION_METHODOLOGY.md) document both pitch mappings.

## Capture new raw app footage

Start Vite on port 4174. Use a current Chrome or Playwright Chromium and FFmpeg with AAC, libx264, and libass. Run the browser capture script and supply a separate output path. This produces a fresh walkthrough recording for editing.

```sh
node scripts/record-demo.mjs earthsona-walkthrough.mp4
```

Set `EARTHSONA_CHROME` to the Chrome executable if needed and `EARTHSONA_URL` to capture a different running build. The script records the actual Web Audio and leaves the underlying audio and captions in the printed temporary folder.
