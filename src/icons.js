const paths = {
  wave: '<path d="M2 12h4l3-6 3 12 3-12 3 6h4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  down: '<path d="M12 4v15m-6-6 6 6 6-6"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  play: '<path d="M9 5v14l11-7z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M9 5v14m6-14v14" stroke-width="3"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 7m-2-7V5m0 6h6"/>',
  speaker: '<path d="M3 10v4h4l5 4V6l-5 4zm13-1a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"/>',
  mute: '<path d="M3 10v4h4l5 4V6l-5 4zm13 0 5 5m0-5-5 5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  map: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 16 5-5 4 3 3-3 5 5"/><circle cx="15" cy="9" r=".8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  compare: '<path d="M7 5v14m10-14v14M4 9h6m4 6h6"/>',
  file: '<path d="M7 3h8l4 4v14H5V3zm7 0v5h5M8 12h8m-8 4h8"/>',
};

export function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
