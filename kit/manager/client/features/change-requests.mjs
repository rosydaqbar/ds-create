// Change requests: "+ Make Change" sits on the right border of whatever is selected on the canvas (an item or
// the page card). It records where the item lives (page, section, group) and what it shows, as a card in the
// Agent tab where the user adds notes. Items with a request carry a "Selected" mark on the canvas.
const $ = id => document.getElementById(id);
const compact = (text, max) => { const t = String(text || '').replace(/\s+/g, ' ').trim(); return t.length > max ? `${t.slice(0, max - 1)}…` : t; };
const route = () => location.hash.slice(1) || 'overview';
// Most specific selection first; the page card counts only when nothing inside it is selected.
const itemSelector = '#content .part-cell.is-selected, #content .part-type-card.is-selected, #content .color-token-card.is-selected, #content [data-select-item].is-selected';
const pageSelector = '#content .selectable-page.is-selected, #content .part-page.is-selected';
const markable = '#content [data-select-item], #content .part-type-card, #content .part-cell, #content .color-token-card, #content .selectable-page, #content .part-page';

function keyOf(el) {
  if (el.matches('.selectable-page, .part-page')) return 'page';
  return el.dataset.selectItem || el.dataset.partCell || el.querySelector('[data-part-type]')?.dataset.partType || el.querySelector('[data-select-token]')?.dataset.selectToken || '';
}
function labelOf(el) {
  const key = keyOf(el);
  if (key === 'page') return `${$('canvas-title')?.textContent.trim() || 'This'} page`;
  if (el.matches('.part-cell')) return el.getAttribute('aria-label') || key;
  if (el.matches('.part-type-card')) return (el.querySelector('[data-part-type]')?.getAttribute('aria-label') || key).replace(/^Select /, '');
  return key.replace(/^(icon|space):/, '');
}
function contextOf(el) {
  const page = $('canvas-title')?.textContent.trim() || route(), isPage = keyOf(el) === 'page', section = isPage ? null : el.closest('section.section');
  let group = '';
  // The closest subheading above the item inside its section, such as "Brand · everyday actions".
  if (section) for (const h of section.querySelectorAll('h3')) if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !h.contains(el)) group = h.textContent.trim();
  const item = labelOf(el), text = compact(isPage ? el.querySelector('.docs-page-header p')?.textContent : el.innerText, 600);
  return {
    page, item, group, panel: document.querySelector('#inspector .workspace-panel-header h2')?.textContent.trim() || '',
    section: section?.querySelector('h2')?.textContent.trim() || '',
    // What the item shows, without repeating its own name.
    details: text.startsWith(item) ? text.slice(item.length).trim() : text,
  };
}

export function setupChangeRequests({ getState, refresh, showAgent }) {
  const button = document.createElement('button');
  button.type = 'button'; button.id = 'make-change'; button.className = 'make-change'; button.hidden = true;
  document.body.append(button);
  let target = null, listKey = '';
  const say = message => { $('change-request-status').textContent = message; };
  const requests = () => getState()?.changeRequests || [];
  const existing = el => requests().find(r => r.route === route() && r.key === keyOf(el));

  async function post(body) {
    const response = await fetch('/api/change-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': getState()?.csrfToken || '' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'This change could not be saved.');
    await refresh();
    return result;
  }
  function focusCard(id) {
    showAgent();
    const card = document.querySelector(`[data-change-id="${CSS.escape(id)}"]`);
    card?.scrollIntoView({ block: 'nearest' });
    card?.querySelector('[data-change-add-note]')?.focus({ preventScroll: true });
  }

  // Keeps the button on the selected item's top-right corner while the canvas pans and zooms.
  function place() {
    const viewport = $('canvas-viewport')?.getBoundingClientRect();
    target = document.querySelector(itemSelector) || document.querySelector(pageSelector);
    const box = target?.getBoundingClientRect();
    const visible = box && viewport && box.right > viewport.left && box.left < viewport.right && box.bottom > viewport.top && box.top < viewport.bottom;
    button.hidden = !visible;
    if (visible) {
      const label = existing(target) ? '✓ In changes' : '+ Make Change';
      if (button.textContent !== label) button.textContent = label;
      // Pinned to the top-right corner: right edge on the card's right edge, straddling its top border.
      const top = Math.max(viewport.top + 8, Math.min(box.top - button.offsetHeight / 2, viewport.bottom - button.offsetHeight - 8));
      const left = Math.max(viewport.left + 8, Math.min(box.right - button.offsetWidth, viewport.right - button.offsetWidth - 8));
      button.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    }
    requestAnimationFrame(place);
  }
  requestAnimationFrame(place);

  button.addEventListener('click', async () => {
    if (!target) return;
    const known = existing(target);
    if (known) { focusCard(known.id); return; }
    button.disabled = true;
    try { const result = await post({ action: 'add', route: route(), key: keyOf(target), context: contextOf(target) }); focusCard(result.id); }
    catch (error) { say(error.message); }
    finally { button.disabled = false; }
  });

  function renderCards() {
    const list = requests(), key = JSON.stringify(list);
    $('change-requests').hidden = !list.length;
    if (key === listKey) return;
    listKey = key;
    const open = new Set([...document.querySelectorAll('[data-change-id]')].filter(c => !c.querySelector('[data-change-form]').hidden).map(c => c.dataset.changeId));
    $('change-request-list').replaceChildren(...list.map(r => {
      const card = $('change-request-card').content.firstElementChild.cloneNode(true);
      card.dataset.changeId = r.id;
      card.querySelector('[data-change-path]').textContent = [r.context.page, r.context.section, r.context.group].filter(Boolean).join(' › ');
      card.querySelector('[data-change-item]').textContent = r.context.item;
      card.querySelector('[data-change-details]').textContent = r.context.details;
      card.querySelector('[data-change-details]').hidden = !r.context.details;
      card.querySelector('[data-change-notes]').replaceChildren(...r.notes.map(n => {
        const row = $('change-request-note').content.firstElementChild.cloneNode(true);
        row.dataset.noteId = n.id; row.querySelector('[data-note-text]').textContent = n.text;
        return row;
      }));
      card.querySelector('[data-change-form]').hidden = !open.has(r.id);
      return card;
    }));
  }
  function markCanvas() {
    const mine = new Set(requests().filter(r => r.route === route()).map(r => r.key));
    for (const el of document.querySelectorAll(markable)) el.toggleAttribute('data-change-marked', mine.has(keyOf(el)));
  }

  $('change-request-list').addEventListener('click', async e => {
    const card = e.target.closest('[data-change-id]'); if (!card) return;
    const id = card.dataset.changeId, form = card.querySelector('[data-change-form]'), input = form.querySelector('textarea');
    try {
      if (e.target.closest('[data-change-add-note]')) { form.hidden = false; input.focus(); }
      else if (e.target.closest('[data-change-cancel]')) { form.hidden = true; input.value = ''; }
      else if (e.target.closest('[data-change-save]')) { if (!input.value.trim()) { input.focus(); return; } form.hidden = true; await post({ action: 'note', id, text: input.value }).catch(error => { form.hidden = false; throw error; }); }
      else if (e.target.closest('[data-note-remove]')) await post({ action: 'remove-note', id, noteId: e.target.closest('[data-note-id]').dataset.noteId });
      else if (e.target.closest('[data-change-remove]')) await post({ action: 'remove', id });
    } catch (error) { say(error.message); }
  });
  $('change-request-copy').addEventListener('click', async () => {
    const text = getState()?.changePrompt;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); $('change-request-copied').textContent = 'Copied. Paste it into your agent.'; }
    catch { say('Copy failed. Try again, or allow clipboard access for this page.'); }
    setTimeout(() => { $('change-request-copied').textContent = ''; }, 2500);
  });
  $('change-request-list').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.target.matches('textarea')) e.target.closest('[data-change-id]').querySelector('[data-change-save]').click();
  });
  return { sync() { renderCards(); markCanvas(); } };
}
