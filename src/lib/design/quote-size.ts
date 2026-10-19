/** Match complete dimensions, never substrings (18 must not become 8). */
export function matchQuoteSize(displaySize: string, shape: string): string {
  const sh = shape.toLowerCase();
  if (sh.includes('bottle') || sh.includes('cap')) return 'bottle-cap';
  if (sh === 'can' || sh === 'can-shape') return 'can-shape';
  const values = (displaySize.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (sh.includes('circle')) return [12, 18].includes(values[0]) ? `circle-${values[0]}` : 'custom';
  if (values.length === 2 && values[0] === values[1] && [8, 12, 16, 18, 24].includes(values[0])) return `${values[0]}x${values[1]}`;
  return 'custom';
}
