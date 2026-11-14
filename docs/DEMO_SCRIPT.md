# EARTHSONA demo

[Watch the captioned demo](https://unknowngod2011.github.io/EARTHSONA/demo/earthsona.mp4). The 29.60-second cut shows the running site at 1600×900, with its real Web Audio and open English captions. The browser audio plays at the app's native rate so the pitch differences are preserved. Luma's existing AI-assisted artwork is visibly credited in the guide, with production information recorded in the MP4 metadata.

| Time | What the viewer sees and hears |
| --- | --- |
| 0–3 s | The EARTHSONA observatory and the opening question, “What does a NASA warming map sound like?” |
| 3–8 s | Open **Listen with Luma**. The scan reads the colors of the 2025 NASA Earth Information Center frame in six stripes, from north to south, and highlights each stripe as it sounds. |
| 8–13.5 s | Hear the Arctic band and global mean for 1980–1989, then 2016–2025. The pairs use one pitch scale and the same sine voice. |
| 13.5–19.5 s | Reveal the mean anomaly shifts between the two windows, **+2.38°C in the Arctic band** and **+0.77°C globally**. The result gives the four underlying means and the 1951–1980 baseline. |
| 19.5–24 s | Open **Method & sources** to see how the site converts both the rendered map and the published numeric record into sound. |
| 24–29.6 s | Return to the observatory and display the public app address. |

## Re-record

Use a current Chrome or Playwright Chromium, and FFmpeg with AAC, libx264 and libass support. Install the project dependencies, start Vite on port 4174, then run:

```sh
node scripts/record-demo.mjs public/demo/earthsona.mp4
```

Set `EARTHSONA_CHROME` to the Chrome executable when using a system browser. Set `EARTHSONA_URL` to capture a different running build. The script drives the real guide, records its Web Audio output, and encodes English captions into a separate lower band. Temporary audio and captions are left in the printed recording folder for review. The official public English demo limit is 30 seconds. [Space Apps demo guidance](https://www.spaceappschallenge.org/resources/project-submission-guide/#tips-for-creating-a-project-demo)
