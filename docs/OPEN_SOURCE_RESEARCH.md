# Prior work and open-source research

## Scientific sonification and visualization precedents

| Reference | Lesson for EARTHSONA |
| --- | --- |
| St. George, Crawford, Reubold and Giorgi, *Making Climate Data Sing* (2017). *A Song of Our Warming Planet* and *Planetary Bands, Warming World* put temperature anomalies into notes, including regional records that a string quartet performs. | Temperature-to-pitch and latitude-band comparisons have a published precedent. EARTHSONA contributes a browser interaction where people choose any two available series, listen over an adjustable time window, and inspect the exact observation behind the sound. The project uses its own mappings and synthesized notes. [Paper and original projects](https://doi.org/10.1175/BAMS-D-15-00223.1) |
| NASA SVS and SYSTEM Sounds, *Data Sonification: Caldwell 73*. A radial sweep cues the listener to the area being heard. The mapping uses distance from the center for pitch and color for instrumentation. | Position, pitch, and timbre can each mean something different if the mappings are explicit. The EIC frame scan uses a north-to-south cue and makes the sampled stripe and color balance visible. Caldwell 73's recording and imagery serve as research references. [NASA SVS #13786](https://svs.gsfc.nasa.gov/13786/) |
| NASA's *A Universe of Sound*. The project published descriptions and studied audience response to astronomical sonifications, including blind and low-vision listeners. | A sonification needs an explained mapping, transport controls, and data available through other senses. EARTHSONA uses labeled controls, an accessible table and textual descriptions. Its accessibility claims are limited to the checks documented in testing. [NASA Open Science](https://science.nasa.gov/open-science/astronomy-data-sonification/) · [Participant-response study](https://arxiv.org/abs/2403.18082) |
| NASA SVS, *Zonal Climate Anomalies 1880–2024*. An animated visualization uses the same eight latitude-band definitions and the same 1951–1980 baseline. | Keep NASA's geography and baseline, then let people inspect an annual reading or replay a selected comparison. [NASA SVS #5451](https://svs.gsfc.nasa.gov/5451/) |

## Technologies evaluated

| Project or standard | License and implementation decision |
| --- | --- |
| Three.js and globe.gl | MIT. General 3D scene controls and reusable WebGL globe layers are a fit for GPU-heavy scenes. A native Canvas renderer serves the single Earth sphere and eight broad latitude bands without depending on WebGL availability. [Three.js license](https://github.com/mrdoob/three.js/blob/dev/LICENSE) · [globe.gl](https://github.com/vasturiano/globe.gl) |
| CesiumJS and deck.gl | Apache-2.0 and MIT respectively. WGS84 globe and tiled terrain in Cesium or GPU analytical layers in deck.gl become useful for sparse points or gridded climate products. EARTHSONA needs a local image, boundaries and pickable bands. [CesiumJS](https://github.com/CesiumGS/cesium) · [deck.gl](https://github.com/visgl/deck.gl) |
| D3 and Plotly.js | ISC and MIT respectively. Both offer reusable numerical scales and chart infrastructure. Native SVG covers a fixed-unit two-series line chart and time cursor, alongside a native HTML data table. [D3 license](https://github.com/d3/d3/blob/main/LICENSE) · [Plotly.js](https://github.com/plotly/plotly.js) |
| Web Audio, Tone.js and howler.js | Web Audio is a browser standard. Tone.js (MIT) provides composition and scheduling tools. howler.js (MIT) provides playback, sprites and format fallback. The app synthesizes short tones and envelopes directly with Web Audio. [Web Audio API recommendation](https://www.w3.org/TR/2021/REC-webaudio-20210617/) · [Tone.js license](https://github.com/Tonejs/Tone.js/blob/dev/LICENSE.md) · [howler.js](https://github.com/goldfire/howler.js) |
| Astronify | BSD-3-Clause. A Python library that converts time-series values to pitch and can help prototype alternative mappings. The app's interactive playback and data probes run directly in the browser. [Astronify](https://github.com/spacetelescope/astronify) |
| xarray | Apache-2.0. Labeled dimensions suit future work with gridded NetCDF. The chosen annual table is a small, versioned CSV with a validated JSON build output. [xarray](https://github.com/pydata/xarray) |

## Included components and material

- **Vite** builds the static app under the MIT license. **Playwright** runs browser checks under Apache-2.0. [Vite license](https://github.com/vitejs/vite/blob/main/LICENSE) · [Playwright license](https://github.com/microsoft/playwright/blob/main/LICENSE)
- **Geist**, **Instrument Serif**, and **IBM Plex Mono** are bundled through Fontsource. The fonts retain their SIL Open Font License 1.1 and original copyright. The deployed files include each font's [license notice](../public/fonts/). [Geist](https://github.com/vercel/geist-font) · [Instrument Serif](https://github.com/Instrument/instrument-serif) · [IBM Plex](https://github.com/IBM/plex) · [Fontsource](https://github.com/fontsource/fontsource)
- The numerical data and official frames retain their source credits. The Blue Marble derivative records its NASA source file, hash and transformation. [Dataset research](DATASET_RESEARCH.md) · [Basemap attribution](../public/earth/README.md) · [NASA media usage](https://www.nasa.gov/nasa-brand-center/images-and-media/)

EARTHSONA's own code implements the frame sampling, fixed-scale note mapping, linked data controls and sphere renderer. Code licenses and source image use follow the scope and credits in the repository.

## Visual references for the mark

React Bits’ Crystalized Ball and Orb informed the crystal, orbit and halo in the EARTHSONA brand mark. Its MIT + Commons Clause license conditions the redistribution of standalone components and ports. The shipped mark uses original SVG geometry and CSS with no imported React Bits code or shaders. [Crystalized Ball](https://reactbits.dev/animations/crystalized-ball) · [Orb](https://reactbits.dev/c/backgrounds/orb) · [React Bits license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)
