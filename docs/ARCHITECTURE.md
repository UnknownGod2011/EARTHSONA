# Architecture

EARTHSONA is a static Vite application. The browser handles interaction, visualization, frame sampling, and synthesis. Every runtime asset is served with the app. The source snapshot and its verification script make the shipped comparison reproducible without network access to NASA during a session.

```mermaid
flowchart LR
    NASA[NASA GISTEMP zonal CSV] --> Snapshot[Pinned CSV and provenance]
    Snapshot --> Validate[Validate, parse and calculate]
    Validate --> JSON[Climate JSON]
    JSON --> State[Observatory state]
    State --> Chart[SVG timeline and text table]
    State --> Globe[Canvas globe]
    State --> Score[Numeric note plan]
    EIC[NASA EIC still images] --> Browser[Browser image decode]
    Browser --> Scan[Canvas pixel scan]
    Scan --> Score2[Image note plan]
    Score --> Audio[Web Audio scheduler]
    Score2 --> Audio
```

## Source pipeline and runtime

`scripts/build-climate.mjs` verifies the official table schema, checks years and values, pins provenance with SHA-256, and generates `src/data/climate.json`. The checked-in CSV also serves as the download in the product. The script recomputes the featured comparisons and verifies each EIC image checksum with `--check`. `src/data/eic.json` identifies each archived map, its source, native dimensions and attribution. Read [Dataset research](DATASET_RESEARCH.md) for source coverage and [Discovered insights](DISCOVERED_INSIGHTS.md) for calculations.

`src/main.js` holds the current year, range, selected series, playback, and view state. `src/layout.js` defines the controls and public-facing explanations. The chart uses SVG paths with missing-value gaps, and the table reads the same observation objects. Switching tracks or modes stops playback before rebuilding the selection. The audio module uses the AudioContext clock with a look-ahead queue and cancels scheduled nodes when playback stops. Cursor and stripe updates track the same score clock. See [Sonification methodology](SONIFICATION_METHODOLOGY.md).

## Globe and frame assets

`src/globe.js` projects a unit sphere orthographically and resolves each visible pixel into latitude and longitude. The NASA Blue Marble Next Generation equirectangular image is sampled using `u = (longitude + 180)/360`, `v = (90 − latitude)/180`. Latitude-band masks use documented GISTEMP latitude boundaries rather than texture pixels. The sphere is a geographic display approximation and conveys neither elevation nor precise distances. The diverging globe color scale saturates at ±3°C. Tooltips, charts, and tables retain the full anomaly. Stills in NASA frames use their original Robinson projection, processing and embedded legends. The frame scan uses approximate latitude stripes and does not reproject the image. [Basemap processing and credit](../public/earth/README.md)

The globe coalesces redraws with `requestAnimationFrame`, caps render resolution, and uses Canvas 2D so a dedicated GPU and WebGL are optional. Band coloring remains available if the basemap image fails. The frame scan caches the derived stripe plan for the selected image until the frame changes. Mobile users can rotate horizontally, pinch to zoom, and scroll vertically. Keyboard rotation, select menus, and the data table provide alternative paths.

The globe exposes its viewing angles to pan the NASA Deep Star Maps 2020 backdrop. The view pans the original star catalog visualization for atmosphere. The sky stays fixed when reduced motion is enabled. [NASA star map](https://svs.gsfc.nasa.gov/4851/) · [Asset provenance and limits](../public/earth/README.md)

## Guided listen and motion

Luma uses the existing keyboard.wtf sprite strips. On arrival it runs toward the measured bounds of the title and waves, with an edge position available for narrow viewports or direct section links. A timer alternates resting, walking through clear space, and peeking near a clear edge. Pointer movement selects one of 16 gaze frames while the pet is idle. Dragging plays the directional run strip and stays within the viewport. Hover, keyboard focus, and the tour suspend wandering. The pet and main-page launchers open the same spotlight tour. The tour calls the app’s view and playback functions and focuses the callout for each stage. Visitors can skip directly to the focused listening challenge from the hero.

The listening challenge is a native dialog with focus return. It reuses the NASA image, frame scanner and Web Audio engine. It calculates the equal-window comparison from the annual observations. The four notes have identical waveform and volume so the interval is the comparison cue. The written reveal keeps the result accessible without listening. The tour plays bundled ElevenLabs MP3s after user interaction. Narration uses one audio element per guide, stops when scientific playback begins, and can be muted. Method & Sources credits the companion artwork and narration. The site uses no microphone, live voice service, or runtime credentials. [Narration asset instructions](LUMA_VOICE_LINES.md)

The theme choice is stored locally. Light mode is the default. Dark mode uses a black page with charcoal surfaces and a decorative star field around the title. The NASA globe has its own sky image. The title reveal sequences particles using the rendered bounds of each letter from left to right. The unrevealed portion has zero opacity. It runs again on reload and restores the original styled heading when it ends. Reduced motion skips the reveal, parks Luma and stops optional backdrop movement. The crystal-orb mark is original SVG with a focus or hover animation.

## Deployment and maintenance

Install from the npm lockfile with `npm ci`. `npm run build` writes a relative-base static bundle. `.github/workflows/pages.yml` validates the bundled snapshots and exercises Chromium before publishing `main`. No server secrets, trackers, third-party runtime calls, database or service worker are required. The host serves normal HTTP cache headers and Vite fingerprints its bundled JS and CSS. After a snapshot refresh, review changed insights and the README’s stated end year before deploying.

Vercel hosts the same static build at `earthsona.vercel.app` using its Vite preset and the linked GitHub repo. Both hosts use the bundled NASA data. [Vercel site](https://earthsona.vercel.app/) · [GitHub Pages site](https://unknowngod2011.github.io/EARTHSONA/)
