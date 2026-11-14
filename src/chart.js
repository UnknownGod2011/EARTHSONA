const low = -3.5;
const high = 3.5;
const left = 43;
const top = 12;
const bottom = 149;
const y = (value) => bottom - (value - low) / (high - low) * (bottom - top);

function pathFor(points, scale, id) {
  let fresh = true;
  return points.map(({ year, values }) => {
    if (!Number.isFinite(values[id])) {
      fresh = true;
      return '';
    }
    const point = `${fresh ? 'M' : 'L'}${scale(year).toFixed(2)},${y(values[id]).toFixed(2)}`;
    fresh = false;
    return point;
  }).join(' ');
}

export function renderChart(node, points, primary, comparison) {
  const width = node.clientWidth || 980;
  const right = width - 25;
  const plotWidth = right - left;
  const start = points[0].year;
  const end = points.at(-1).year;
  const x = (year) => start === end ? (left + right) / 2 : left + (year - start) / (end - start) * plotWidth;
  const divisions = width < 500 ? 2 : 4;
  const ticks = [...new Set(Array.from({ length: divisions + 1 }, (_, i) => Math.round(start + (end - start) * i / divisions)))];
  node.innerHTML = `<svg viewBox="0 0 ${width} 178" preserveAspectRatio="none" aria-hidden="true">
    ${[-3, -2, -1, 0, 1, 2, 3].map((n) => `<path class="grid-line ${n === 0 ? 'baseline' : ''}" d="M${left} ${y(n)}H${right}"/><text class="chart-y" x="8" y="${y(n) + 4}">${n > 0 ? '+' : ''}${n}</text>`).join('')}
    ${ticks.map((year) => `<text x="${x(year)}" y="170" text-anchor="middle" class="chart-x">${year}</text>`).join('')}
    ${comparison ? `<path class="chart-b" d="${pathFor(points, x, comparison)}"/>` : ''}
    <path class="chart-a" d="${pathFor(points, x, primary)}"/>
    <g data-cursor><path class="chart-cursor" d="M0 ${top} V${bottom}"/><circle class="chart-dot a" r="5"/><circle class="chart-dot b" r="5"/></g>
  </svg>`;
  const cursor = node.querySelector('[data-cursor]');
  const dots = cursor.querySelectorAll('circle');
  return {
    update(year, values) {
      const visible = start <= year && year <= end;
      cursor.style.display = visible ? '' : 'none';
      cursor.setAttribute('transform', `translate(${x(year)} 0)`);
      for (const [i, id] of [primary, comparison].entries()) {
        const value = values[id];
        dots[i].style.display = Number.isFinite(value) ? '' : 'none';
        dots[i].setAttribute('cy', Number.isFinite(value) ? y(value) : 0);
      }
    },
    yearAt(clientX) {
      const bounds = node.getBoundingClientRect();
      const proportion = ((clientX - bounds.left) / bounds.width * width - left) / plotWidth;
      return Math.round(start + Math.max(0, Math.min(1, proportion)) * (end - start));
    },
  };
}
