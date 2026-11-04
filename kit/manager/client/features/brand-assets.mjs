// 1.8 Brand assets: the logo files the user put in Context, each drawn as it is on a light and a dark stage.
// Nothing is redrawn or invented (specs/foundations/1.8-brand-assets.md); a label comes only from the file name.
const variantWords = { wordmark: 'Wordmark', lockup: 'Lockup', mark: 'Mark', light: 'Light', dark: 'Dark' };
export function brandVariants(name) {
  const words = new Set(String(name).replace(/\.[^.]+$/, '').toLowerCase().split(/[^a-z0-9]+/));
  return Object.entries(variantWords).filter(([word]) => words.has(word)).map(([, label]) => label);
}
export function fileSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 102.4) / 10} KB` : `${Math.round(bytes / 104857.6) / 10} MB`;
}
export const typeName = type => ({ 'image/svg+xml': 'SVG', 'image/png': 'PNG', 'image/jpeg': 'JPEG', 'image/webp': 'WebP' })[type] || type;

export function brandAssetsContent({ assets, query = '', escape, previewCard }) {
  const term = query.trim().toLowerCase(), list = assets.filter(a => a.key.toLowerCase().includes(term));
  const card = a => {
    const labels = brandVariants(a.name), img = `<img src="${escape(a.url)}" alt="${escape(a.name)}" draggable="false" />`;
    return previewCard(`<span>${escape(a.name.replace(/\.[^.]+$/, ''))}</span>${labels.length ? `<span class="brand-asset-labels">${labels.map(l => `<span class="brand-asset-label">${escape(l)}</span>`).join('')}</span>` : ''}`,
      `<span class="brand-asset-pane" data-surface="light">${img}</span><span class="brand-asset-pane" data-surface="dark">${img.replace(/alt="[^"]*"/, 'alt=""')}</span>`,
      { select: a.key, className: 'brand-asset-card', stageClass: 'brand-asset-stage', caption: `<span class="specimen-caption"><code>${escape(a.key).replaceAll('/', '/<wbr>')}</code><small>${escape(`${typeName(a.type)} · ${fileSize(a.size)}`)}</small></span>` });
  };
  return `<section class="section"><div class="section-heading"><h2>Logos from Context</h2><small>${list.length} of ${assets.length} ${assets.length === 1 ? 'file' : 'files'}</small></div><p>Each file is previewed on light and dark backgrounds.</p>${list.length ? `<div class="brand-asset-grid">${list.map(card).join('')}</div>` : '<p>No files match your filter.</p>'}</section>`;
}
