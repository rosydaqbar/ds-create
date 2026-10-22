// Builder chrome motion is separate from the design system's editable Motion tokens.
export function createDialogMotion({
  reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  readStyle = el => getComputedStyle(el),
  schedule = (fn, ms) => setTimeout(fn, ms),
  unschedule = id => clearTimeout(id),
} = {}) {
  const closing = new WeakMap(), bound = new WeakSet();
  function bind(dialog) {
    if (bound.has(dialog)) return;
    bound.add(dialog);
    dialog.addEventListener('cancel', event => { if (!event.defaultPrevented) { event.preventDefault(); close(dialog); } });
    dialog.addEventListener('close', () => {
      // A native close event is queued; it may arrive after a synchronous reopen.
      if (dialog.open) return;
      dialog.classList.remove('is-open', 'is-closing');
      const pending = closing.get(dialog);
      if (pending) { unschedule(pending.timer); closing.delete(dialog); pending.resolve(true); }
    });
  }
  function open(dialog) {
    bind(dialog);
    const pending = closing.get(dialog);
    if (pending) { unschedule(pending.timer); closing.delete(dialog); pending.resolve(false); }
    dialog.classList.add('t-modal');
    dialog.classList.remove('is-closing');
    if (!dialog.open) {
      dialog.classList.remove('is-open');
      dialog.showModal();
      void dialog.offsetWidth;
    }
    dialog.classList.add('is-open');
  }
  function close(dialog, { immediate = false } = {}) {
    if (!dialog.open) return Promise.resolve(false);
    bind(dialog);
    const existing = closing.get(dialog);
    if (existing && !immediate) return existing.promise;
    if (existing) { unschedule(existing.timer); closing.delete(dialog); existing.resolve(false); }
    if (immediate || reduced()) {
      dialog.close(); dialog.classList.remove('is-open', 'is-closing');
      return Promise.resolve(true);
    }
    const raw = readStyle(dialog).getPropertyValue('--modal-close-dur').trim();
    const ms = Number.parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000) || 150;
    dialog.classList.remove('is-open'); dialog.classList.add('is-closing');
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    const record = { promise, resolve, timer: null };
    closing.set(dialog, record);
    record.timer = schedule(() => {
      if (closing.get(dialog) !== record) return;
      closing.delete(dialog);
      dialog.close(); dialog.classList.remove('is-open', 'is-closing'); resolve(true);
    }, ms);
    return promise;
  }
  return { open, close };
}
const dialogs = createDialogMotion();
export const openDialog = dialog => dialogs.open(dialog);
export const closeDialog = (dialog, options) => dialogs.close(dialog, options);

export function interactionPlan(kind, reduced) {
  if (reduced) return { keyframes: [{ opacity: 0.65 }, { opacity: 1 }], duration: 80 };
  if (kind === 'step') return { keyframes: [{ opacity: 0.35, clipPath: 'inset(0 0 12px 0)', filter: 'blur(1px)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)', filter: 'blur(0)' }], duration: 200 };
  return { keyframes: [{ opacity: 0.5 }, { opacity: 1 }], duration: 160 };
}
const active = new Map();
export function revealInteraction(element, kind = 'view') {
  if (!element || element.hidden || document.hidden || !element.getClientRects().length || !element.animate) return;
  active.get(element)?.cancel();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plan = interactionPlan(kind, reduced);
  const style = getComputedStyle(element);
  const token = kind === 'step' ? '--builder-motion-step' : '--builder-motion-view';
  const duration = reduced ? plan.duration : Number.parseFloat(style.getPropertyValue(token)) || plan.duration;
  const animation = element.animate(plan.keyframes, { duration, easing: style.getPropertyValue('--modal-ease').trim() || 'ease-out' });
  active.set(element, animation);
  animation.finished.catch(() => {}).finally(() => { if (active.get(element) === animation) active.delete(element); });
}
export function installInteractionMotion() {
  const finish = () => { for (const a of active.values()) a.finish(); active.clear(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', finish);
}
