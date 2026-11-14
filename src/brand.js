// Original geometry for the EARTHSONA mark. Visual references: React Bits
// Crystalized Ball and Orb. A single CSS orbit runs during hover or focus.
// https://reactbits.dev/animations/crystalized-ball
// https://reactbits.dev/c/backgrounds/orb
export function initBrand() {
  document.querySelectorAll('.brand-mark').forEach((mark, index) => {
    const id = `earthsona-mark-${index}`;
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = `<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${id}-field" cx="34%" cy="24%" r="90%">
          <stop stop-color="#3d4b82"/><stop offset=".65" stop-color="#201d41"/><stop offset="1" stop-color="#0d1229"/>
        </radialGradient>
        <linearGradient id="${id}-halo" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop stop-color="#a77aff"/><stop offset=".48" stop-color="#597ed2" stop-opacity=".55"/><stop offset="1" stop-color="#a3f5eb"/>
        </linearGradient>
        <linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop stop-color="#c6fdf4"/><stop offset=".54" stop-color="#91b0ff"/><stop offset="1" stop-color="#7a50da"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21.5" fill="url(#${id}-field)" stroke="#4a5083" stroke-width="1"/>
      <g class="brand-orbit">
        <circle cx="24" cy="24" r="19" fill="none" stroke="url(#${id}-halo)" stroke-width="1.3" stroke-dasharray="44 6 27 7 19 16"/>
        <circle cx="36.5" cy="9.7" r="2.1" fill="#b7fff1"/>
        <circle cx="9" cy="35.7" r="1.4" fill="#c095ff"/>
        <path d="M12 8v4m-2-2h4M39 32v3m-1.5-1.5h3" stroke="#b9b1ff" stroke-width=".8" stroke-linecap="round"/>
      </g>
      <path d="M24 9l10 12-4 13-6 5-7-5-4-13z" fill="url(#${id}-glass)" stroke="#bbd2ff" stroke-width=".75"/>
      <path d="M24 9l-.1 15L13 21zm0 15 10-3-4 13-6 5z" fill="#122265" opacity=".36"/>
      <path d="M17 34l7-10-.1-15 4.1 13-4 17z" fill="#e7fffb" opacity=".25"/>
      <path d="M12.4 25h5.2l2.7-5 3.1 8.4 3.2-6.2 2.2 2.8h6.7" fill="none" stroke="#effffb" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  });
}
