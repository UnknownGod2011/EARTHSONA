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

## Deployment and maintenance

Install from the npm lockfile with `npm ci`. `npm run build` writes a relative-base static bundle. `.github/workflows/pages.yml` validates the bundled snapshots and exercises Chromium before publishing `main`. No server secrets, trackers, third-party runtime calls, database or service worker are required. The host serves normal HTTP cache headers and Vite fingerprints its bundled JS and CSS. After a snapshot refresh, review changed insights and the README’s stated end year before deploying.
