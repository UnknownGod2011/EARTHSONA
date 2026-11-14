# Testing

## Reproduce

```sh
npm ci
npm run data:check
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

To run the Playwright tests against an existing Chrome binary, set `EARTHSONA_CHROME` to its full path. The tests start or reuse a Vite server on `127.0.0.1:4174`. CI runs Chromium on Ubuntu and publishes only after the checks and production build succeed.

## Evidence collected November 14, 2026

| Check | Coverage |
| --- | --- |
| Provenance | Verified the pinned CSV, processed data and three NASA EIC image hashes. The CSV has 146 calendar years and nine shipped series. The global readings match all 146 corresponding entries in NASA’s separate calendar-year table. |
| Unit tests | Verified shared pitch scale, clipping, silence for missing inputs, timing-independent pitch, frame stripe order, image masks, older layout support and invalid source rejection. |
| Chrome interaction | Verified the landing view, exact 2016 polar comparison readings, keyboard globe selection, pointer drag, zoom/reset, chart and table, range and speed, play/pause/resume state, mute and switching to solo. |
| Real frame scans | Decoded each shipped EIC image in Chromium, played the browser-generated scan, and verified the active stripe and frequency. 2023, 2024 and 2025 all yielded six valid notes. Checked the separate global annual reading. |
| Mobile and fallback | Verified the 320 and 390 CSS-pixel layouts fit without horizontal overflow. Inspected the 390-pixel rendering and verified tap selection, pinch zoom and page scrolling with emulated touch. Deliberately blocked the basemap asset and verified the banded fallback and numeric controls. |
| Media | Captured the actual browser app and exported the screenshots in [`screenshots`](../screenshots/). The demo captures the running browser and its Web Audio output. |
| Deployment | Ubuntu Chromium checks and GitHub Pages deployment passed in GitHub Actions. Both the app and the MP4 served over public HTTPS. Local interaction checks passed in Chrome and Edge. |

During integration, the comparison label remained stale after selecting solo playback. The browser suite reproduced it, and the transport now refreshes whenever a selection changes. The production viewport sweep found a 13-pixel title overflow at 320 CSS pixels, fixed by reducing the minimum title size. Source review also caught an image-decode delay before AudioContext activation and a dependency on the latest CSV year for frame selection. Playback unlocks synchronously on interaction, and the frame picker initializes from its separate catalog.

The scope covers Chromium on desktop and touch emulation. Native iOS and Safari, subjective listening studies, and formal assistive-technology audits remain unverified.

## Guided listen and visual update

- In Chrome, opened the guide by keyboard, played the actual 2025 NASA frame scan, heard both decade pairs, checked the reported changes and mean table, and confirmed Escape returns focus to the launch control.
- Checked the optional dark preference across reload and at 320 CSS pixels. Verified the particle intro advances letter by letter, replays on reload, fits the narrow viewport, and respects reduced motion. Reduced motion also keeps the star field static while the globe remains controllable.
- Opened the roaming Luma greeting by keyboard, started the six-step tour, played the map scan through the highlighted app controls, and opened the Arctic comparison. Verified the tour resumes at Discoveries after the result, focuses the methodology on completion, and restores launch focus on Escape. The callouts fit at 320 and 1440 CSS pixels.
- The tour plays nine prerecorded ElevenLabs clips across the tour and experiment, with visible written instructions and independent scientific audio. [Voice lines](LUMA_VOICE_LINES.md)
- Checked Luma’s right-edge entrance, landing beside “Earth,” greeting, gaze in opposite directions, directional run frames while dragging, pause preference across reload, reduced motion, and keyboard entry. Confirmed that mobile navigation keeps Observatory, Discoveries, and Sources available.
- Checked the 29.70-second, 1920 × 1080 demo for complete video and stereo audio decode. Verified all 38 notes in the final AAC stream against the app’s pitch mapping. Checked the scan and comparison visuals against their cues, including the globe’s year labels, the evidence result and the closing URL. [Recording details](DEMO_SCRIPT.md)
