export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const clampZoom = value => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));

// Preserve the world coordinate below the cursor while changing scale.
export function zoomAt(camera, scale, anchor) {
  const next = clampZoom(scale);
  return { scale: next, x: anchor.x - (anchor.x - camera.x) * next / camera.scale,
    y: anchor.y - (anchor.y - camera.y) * next / camera.scale };
}
export function fitCamera(content, viewport, padding = 48) {
  const scale = clampZoom(Math.min(1, Math.max(1, viewport.width - padding * 2) / Math.max(1, content.width),
    Math.max(1, viewport.height - padding * 2) / Math.max(1, content.height)));
  return { scale, x: (viewport.width - content.width * scale) / 2, y: (viewport.height - content.height * scale) / 2 };
}
export function initialCamera(viewport, width = 1120) {
  const scale = clampZoom(Math.min(0.68, (viewport.width - 64) / width));
  return { scale, x: (viewport.width - width * scale) / 2, y: 48 };
}

export function createCanvas(viewport, world, onChange) {
  const cameras = new Map();
  let key;
  let camera = { scale: 0.68, x: 48, y: 48 };
  const size = () => ({ width: viewport.clientWidth, height: viewport.clientHeight });
  const center = () => ({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 });
  const local = e => { const box = viewport.getBoundingClientRect(); return { x: e.clientX - box.left, y: e.clientY - box.top }; };
  function apply(next) {
    camera = next;
    if (key) cameras.set(key, { ...camera });
    world.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
    viewport.dataset.zoom = String(camera.scale);
    onChange(camera);
  }
  const zoom = (scale, anchor = center()) => apply(zoomAt(camera, scale, anchor));
  const fit = () => apply(fitCamera({ width: world.offsetWidth, height: world.offsetHeight }, size()));
  const pan = (x, y) => apply({ ...camera, x: camera.x + x, y: camera.y + y });
  const pointers = new Map();
  let last;
  let pinch;
  let dragged = false;
  const pinchMetrics = () => {
    const [a, b] = [...pointers.values()];
    return { distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };
  viewport.addEventListener('pointerdown', e => {
    if (![0, 1].includes(e.button) || e.target.closest('button, input, select, textarea, a, summary')) return;
    e.preventDefault();
    viewport.focus({ preventScroll: true });
    viewport.setPointerCapture(e.pointerId);
    const point = local(e);
    pointers.set(e.pointerId, point);
    last = point;
    dragged = false;
    if (pointers.size === 2) pinch = { ...pinchMetrics(), camera: { ...camera } };
    viewport.classList.add('is-panning');
  });
  viewport.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    const point = local(e);
    pointers.set(e.pointerId, point);
    if (pointers.size === 2 && pinch) {
      const metrics = pinchMetrics();
      const next = zoomAt(pinch.camera, pinch.camera.scale * metrics.distance / pinch.distance, pinch.midpoint);
      apply({ ...next, x: next.x + metrics.midpoint.x - pinch.midpoint.x, y: next.y + metrics.midpoint.y - pinch.midpoint.y });
      dragged = true;
    } else if (last) {
      const dx = point.x - last.x, dy = point.y - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) dragged = true;
      pan(dx, dy);
    }
    last = point;
  });
  function end(e) {
    pointers.delete(e.pointerId);
    pinch = null;
    last = [...pointers.values()][0];
    if (!pointers.size) viewport.classList.remove('is-panning');
  }
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  viewport.addEventListener('lostpointercapture', end);
  viewport.addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientHeight : 1;
    if (e.ctrlKey || e.metaKey) zoom(camera.scale * Math.exp(-e.deltaY * unit * 0.008), local(e));
    else pan(-(e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * unit, -(e.shiftKey ? 0 : e.deltaY) * unit);
  }, { passive: false });
  viewport.addEventListener('keydown', e => {
    if (e.target !== viewport) return;
    if (['+', '=', '-', '0', '1', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      if (e.key === '+' || e.key === '=') zoom(camera.scale * 1.2);
      else if (e.key === '-') zoom(camera.scale / 1.2);
      else if (e.key === '0') zoom(1);
      else if (e.key === '1') fit();
      else pan(e.key === 'ArrowLeft' ? 60 : e.key === 'ArrowRight' ? -60 : 0, e.key === 'ArrowUp' ? 60 : e.key === 'ArrowDown' ? -60 : 0);
    }
  });
  let previousSize = size();
  new ResizeObserver(() => {
    const next = size();
    if (!next.width || !next.height) return;
    if (key && previousSize.width && previousSize.height) pan((next.width - previousSize.width) / 2, (next.height - previousSize.height) / 2);
    previousSize = next;
  }).observe(viewport);
  return { zoom, fit, pan, get: () => ({ ...camera }), refresh(nextKey) {
    if (!viewport.clientWidth || !viewport.clientHeight) return;
    if (key !== nextKey) { key = nextKey; apply(cameras.get(key) || initialCamera(size(), world.offsetWidth)); }
    else apply(camera);
  } };
}
