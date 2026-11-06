// Copy text for every Copy button in Builder. The Clipboard API exists only on secure pages (localhost or
// HTTPS); Builder opened from another device over plain HTTP has none, so copy through a selected text field
// instead. Runs synchronously inside the click when the API is missing, which the browser requires. Throws when
// neither way copies.
export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* permission denied: try the field */ }
  }
  const field = document.createElement('textarea'), focused = document.activeElement;
  field.value = text; field.setAttribute('readonly', ''); field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(field); field.focus(); field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } finally { field.remove(); focused?.focus?.({ preventScroll: true }); }
  if (!copied) throw new Error('Copy failed.');
}
