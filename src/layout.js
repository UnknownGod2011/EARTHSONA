import { icon } from './icons.js';
import { DEFAULT_VOLUME } from './sonification.js';

export function layout(first, last) {
  return `
    <header class="site-header"><div class="shell header-inner">
      <a class="brand" href="#top"><span class="brand-mark">${icon('wave', 23)}</span> EARTHSONA</a>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="#observatory">${icon('globe', 16)} <span>Observatory</span></a>
        <a href="#findings">${icon('wave', 16)} <span>Discoveries</span></a>
        <a href="#method">${icon('file', 16)} <span>Sources</span></a>
      </nav>
      <div class="header-actions"><button id="theme-toggle" class="theme-toggle" type="button" aria-label="Dark mode" aria-pressed="false" title="Dark mode"></button><button type="button" class="header-cta" data-open-tour>Take the tour ${icon('arrow', 17)}</button></div>
    </div></header>
    <main class="shell" id="top">
      <section class="hero" aria-labelledby="hero-title">
        <div><div class="eyebrow"><span class="signal-dot"></span> THE EARTH INFORMATION JUKEBOX</div>
        <h1 id="hero-title">Hear the <em>Earth.</em></h1></div>
        <div class="hero-right"><p>Hear a NASA map, then compare how the Arctic and the world have warmed using more than a century of temperature records.</p><div class="hero-actions"><button id="start-tour" class="guide-cta" type="button" data-open-tour>${icon('arrow', 18)} Tour with Luma</button><button id="start-guide" class="primary-link listen-shortcut" type="button" data-open-guide>${icon('play', 17)} Listen with Luma</button></div></div>
      </section>
      <section id="observatory" class="observatory" tabindex="-1" aria-label="Listening observatory">
        <div class="workspace">
          <div class="viewport">
            <div class="viewport-bar">
              <div class="view-switch" role="group" aria-label="Visualization mode">
                <button id="mode-globe" type="button" aria-pressed="true">${icon('globe', 17)} Climate globe</button>
                <button id="mode-frame" type="button" aria-pressed="false">${icon('map', 17)} NASA frames</button>
              </div>
              <span class="viewport-type" id="view-caption">GISTEMP V4 / ANNUAL</span>
            </div>
            <div id="globe-view" class="globe-view">
              <div class="stars" id="sky-backdrop" aria-hidden="true"></div>
              <div class="globe-year" aria-hidden="true"><span id="globe-year">${last}</span><small>°C ANOMALY</small></div>
              <canvas id="earth" aria-label="Interactive Earth showing latitude-band temperature anomalies. Use arrow keys to rotate and Enter to select the center band."></canvas>
              <div class="globe-tools" role="group" aria-label="Globe controls">
                <button id="zoom-in" type="button" aria-label="Zoom in">${icon('plus', 18)}</button>
                <button id="zoom-out" type="button" aria-label="Zoom out">${icon('minus', 18)}</button>
                <button id="reset-view" type="button" aria-label="Reset globe view">${icon('reset', 16)}</button>
              </div>
              <div class="globe-caption"><span id="globe-status">NASA BLUE MARBLE BASEMAP</span><span>Drag to rotate · Select a band</span></div>
            </div>
            <div id="frame-view" class="frame-view" hidden>
              <div class="frame-mat"><img id="eic-image" alt=""/><div id="frame-beam" aria-hidden="true" hidden></div></div>
              <div class="frame-credit"><span>NASA SCIENTIFIC VISUALIZATION STUDIO</span><a id="frame-source" target="_blank" rel="noreferrer">Open source ${icon('external', 14)}</a></div>
            </div>
            <div class="viewport-footer" id="globe-legend"><span>1951–1980 BASELINE</span><div class="legend" title="Band tint saturates at these values. The record keeps the full reading."><span id="legend-min"></span><i></i><span id="legend-max"></span></div><span class="legend-unit">°C</span></div>
          </div>
          <aside class="console" id="console" aria-labelledby="console-title">
            <div class="console-heading"><span class="eyebrow"><span class="signal-dot"></span> LISTENING STUDIO</span><a href="#method" class="info-link" aria-label="Read the methodology">${icon('info', 19)}</a></div>
            <div id="globe-controls">
              <h2 id="console-title">Climate tracks</h2>
              <p class="muted intro-text">Higher anomaly, higher pitch. Compare two tracks on the same scale.</p>
              <div class="track-stack">
                <div class="track primary-track"><span class="track-line"></span><div><label for="primary">Primary track</label><select id="primary"></select></div><output id="primary-value" for="primary year"></output></div>
                <div class="track compare-track"><span class="track-line"></span><div><label for="comparison">Compare with</label><select id="comparison"></select></div><output id="compare-value" for="comparison year"></output></div>
              </div>
              <div class="console-row"><label for="year">Year <output id="year-output" for="year">${last}</output></label><span id="frequency" class="mono"></span></div>
              <input type="range" id="year" min="${first}" max="${last}" value="${last}" />
              <div class="range-endpoints mono"><span>${first}</span><span>${last}</span></div>
              <details id="range-options"><summary>Playback range and speed ${icon('chevron', 16)}</summary><div class="settings-grid">
                <label>From<input id="from-year" type="number" min="${first}" max="${last}" /></label>
                <label>To<input id="to-year" type="number" min="${first}" max="${last}" /></label>
                <label>Years / sec<select id="speed"><option>2</option><option selected>4</option><option>8</option></select></label>
              </div></details>
            </div>
            <div id="frame-controls" hidden>
              <h2 id="frame-title">NASA frames</h2>
              <p class="muted intro-text">See official NASA maps and hear how their image colors change from north to south.</p>
              <div class="frame-picker" id="frame-picker" role="group" aria-label="NASA frame year"></div>
              <label class="frame-mode" for="frame-audio">Sound source<select id="frame-audio"><option value="pixels">Frame colors</option><option value="data">GISTEMP annual reading</option></select></label>
              <p id="frame-description" class="frame-description"></p>
              <p id="frame-limitation" class="frame-limitation muted">Pitch follows colors in this image. Compare temperatures across years in Climate globe.</p>
              <div id="scan-status" class="scan-status mono" aria-live="off"></div>
              <details id="scan-readings" class="scan-readings" hidden><summary>Inspect the six scan notes ${icon('chevron', 16)}</summary><ol id="scan-note-list"></ol></details>
            </div>
            <div class="transport" aria-label="Playback controls">
              <button type="button" id="play" class="play" aria-label="Play">${icon('play', 24)}</button>
              <div class="transport-text"><strong id="play-title">Play comparison</strong><span id="play-detail" class="mono"></span></div>
              <button type="button" id="restart" class="icon-button" aria-label="Restart playback" title="Restart playback">${icon('reset', 20)}</button>
              <button type="button" id="mute" class="icon-button" aria-label="Mute" aria-pressed="false">${icon('speaker', 20)}</button>
            </div>
            <div class="volume-line"><label for="volume">Volume</label><input type="range" id="volume" min="0" max="100" value="${DEFAULT_VOLUME * 100}" /></div>
            <p id="audio-message" class="status-text" role="status" hidden></p>
          </aside>
        </div>
        <div class="timeline">
          <div class="timeline-heading"><div><span class="eyebrow">ANNUAL TEMPERATURE ANOMALY</span><h2>How the tracks change</h2></div><div id="chart-labels" class="chart-labels"></div></div>
          <div class="chart-shell"><div id="chart" aria-label="Annual temperature anomaly line chart"></div></div>
          <p class="chart-note muted">Select a chart point, or use the year slider, to inspect the reading. Change the playback range to explore different years. An anomaly is a difference from the 1951–1980 average.</p>
          <details id="table-details"><summary>View selected data as a table ${icon('chevron', 16)}</summary><div id="data-table" class="data-table"></div></details>
        </div>
      </section>
      <section class="discoveries" id="findings" aria-labelledby="findings-title">
        <div class="section-heading"><div><span class="eyebrow">DISCOVERIES</span><h2 id="findings-title">Patterns worth <em>hearing.</em></h2></div><p class="muted">Each comparison opens the same observations behind the finding.</p></div>
        <div class="insight-grid" id="insight-grid"></div>
      </section>
      <section id="method" class="method" tabindex="-1" aria-labelledby="method-title">
        <div class="section-heading"><div><span class="eyebrow">METHOD & SOURCES</span><h2 id="method-title">From data <em>to sound.</em></h2></div></div>
        <div class="method-grid">
          <article><h3>Climate tracks</h3><p>One explorer note represents one calendar year. Zero anomaly plays at 220 Hz. Every 2°C increases pitch by one octave, using a fixed −3.5°C to +3.5°C range. With two tracks, hear the primary tone first and the comparison tone just after it.</p><p>NASA GISTEMP combines land surface air temperatures and sea surface temperatures. The globe tints each latitude band by its annual anomaly, capped at ±3°C for color. Blue Marble and the star field provide visual context. The sky moves as you explore the globe, without alignment to a particular place or time.</p><div id="data-provenance"></div></article>
          <article><h3>NASA frame scan</h3><p>Select a map and play the image colors from north to south. The scan uses red and blue channel differences from sampled map pixels. Redder samples raise the pitch and bluer samples lower it. Use Climate tracks to hear numeric anomalies in °C.</p><p>The three maps use Robinson projection. Layout, palette and processing vary by release. Use the official numeric series to compare years on one scale.</p><a id="catalog" class="text-link" target="_blank" rel="noreferrer">NASA Earth Information Center catalog ${icon('external', 16)}</a></article>
        </div>
        <p class="media-credits muted"><strong>Media credits.</strong> Luma’s illustration is AI-assisted. Luma’s narration was generated with Jessica at elevenlabs.io.</p>
      </section>
    </main>
    <footer><div class="shell footer-inner"><a class="brand" href="#top"><span class="brand-mark">${icon('wave', 23)}</span> EARTHSONA</a><span>Built for NASA Space Apps Challenge 2026</span><div class="footer-links"><a href="${import.meta.env.BASE_URL}demo/" target="_blank" rel="noreferrer">Watch the demo ${icon('external', 16)}</a><a href="https://github.com/UnknownGod2011/EARTHSONA" target="_blank" rel="noreferrer">Source on GitHub ${icon('external', 16)}</a></div></div></footer>`;
}
