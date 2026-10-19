/** Review checks only: never a manufacturing approval or a production dieline. */
export interface ProofLayer {
  id?: string; embossRequested?: boolean;
  label: string; type: string; left: number; top: number; width: number; height: number;
  ppi?: number; maskSvg?: string;
}
export function reviewWarnings(layers: ProofLayer[], width: number, height: number) {
  const warnings = ['Review artwork has no production bleed.', 'Die shape, mounting holes and embossing clearances need an approved production proof.', 'Color conversion and font outlining have not been verified.'];
  if (!layers.length) warnings.unshift('Your canvas has no artwork yet.');
  layers.forEach(layer => {
    if (layer.left < 0 || layer.top < 0 || layer.left + layer.width > width * 72 || layer.top + layer.height > height * 72) warnings.push(`${layer.label}: artwork extends beyond the layout trim.`);
    if (layer.type.toLowerCase() === 'image') warnings.push(Number.isFinite(layer.ppi) ? `${layer.label}: about ${Math.floor(layer.ppi!)} PPI at placed size${layer.ppi! < 300 ? ' — below the site’s 300 PPI artwork guidance' : '; original quality still needs review'}.` : `${layer.label}: image resolution could not be verified.`);
    if (layer.type.toLowerCase() === 'group') warnings.push(`${layer.label}: grouped artwork needs a separate resolution and embossing review.`);
  });
  return warnings;
}
export function conceptMask(layers: ProofLayer[], selected: number[], width: number, height: number) {
  const content = layers.filter((layer, index) => selected.includes(index) && layer.maskSvg).map(layer => layer.maskSvg).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}in" height="${height}in" viewBox="0 0 ${width * 72} ${height * 72}"><title>Embossing intent only — not an approved tooling mask</title>${content}</svg>`;
}
export function proofNotes(layers: ProofLayer[], selected: number[], preference: string) {
  const names = layers.flatMap((layer, i) => selected.includes(i) ? [`${layer.label}${layer.id ? ' [element ' + layer.id + ']' : ''}`] : []).join(', ').slice(0, 600);
  return `Please prepare a production proof. Embossing preference: ${preference}. ${preference === 'yes' ? `Requested raised elements: ${names || 'please advise'}. ` : ''}Automatic preview is unapproved; confirm die, holes, bleed, image quality, fonts and embossing feasibility.`;
}
