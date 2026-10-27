import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_ZOOM, MIN_ZOOM, createCanvas, fitCamera, initialCamera, zoomAt} from '../kit/manager/client/canvas.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 0.00001, `${a} != ${b}`);
test('zoom preserves the world coordinate beneath its pointer anchor', () => {
  const camera = { x: -310, y: 92, scale: 0.68 };
  const anchor = { x: 420, y: 200 };
  const next = zoomAt(camera, 1.6, anchor);
  near((anchor.x - camera.x) / camera.scale, (anchor.x - next.x) / next.scale);
  near((anchor.y - camera.y) / camera.scale, (anchor.y - next.y) / next.scale);
  const restored = zoomAt(next, camera.scale, anchor);
  near(restored.x, camera.x); near(restored.y, camera.y);
});
test('zoom limits retain anchor position rather than moving the document at its bounds', () => {
  const camera = { x: 10, y: -40, scale: 1 };
  const anchor = { x: 100, y: 150 };
  assert.equal(zoomAt(camera, 100, anchor).scale, MAX_ZOOM);
  assert.equal(zoomAt(camera, 0.001, anchor).scale, MIN_ZOOM);
  const limit = zoomAt(camera, 100, anchor);
  assert.deepEqual(zoomAt(limit, 100, anchor), limit);
});
test('Fit centers the full content inside the viewport with padding', () => {
  const content = { width: 1120, height: 1600 };
  const viewport = { width: 912, height: 726 };
  const camera = fitCamera(content, viewport);
  assert.ok(content.width * camera.scale <= viewport.width - 96);
  assert.ok(content.height * camera.scale <= viewport.height - 96);
  near(camera.x + content.width * camera.scale / 2, viewport.width / 2);
  near(camera.y + content.height * camera.scale / 2, viewport.height / 2);
});
test('initial view fits a fixed-width artboard on mobile without reflowing its contents', () => {
  const mobile = initialCamera({ width: 390, height: 660 });
  assert.ok(1120 * mobile.scale <= 390 - 64);
  const desktop = initialCamera({ width: 912, height: 726 });
  assert.equal(desktop.scale, 0.68);
  assert.equal(desktop.y, 48);
});

test('hidden processing viewport cannot initialize or corrupt a route camera',()=>{
  const previous=globalThis.ResizeObserver;let resize;
  globalThis.ResizeObserver=class {constructor(fn){resize=fn;}observe(){}};
  try {
    const viewport={clientWidth:0,clientHeight:0,addEventListener(){},dataset:{}},world={offsetWidth:1120,offsetHeight:1800,style:{}};
    const c=createCanvas(viewport,world,()=>{});
    c.refresh('overview');assert.equal(world.style.transform,undefined);
    viewport.clientWidth=912;viewport.clientHeight=726;resize();c.refresh('overview');
    assert.deepEqual(c.get(),initialCamera({width:912,height:726}));
    c.pan(-20,-100);const before=c.get();
    viewport.clientWidth=0;viewport.clientHeight=0;resize();c.refresh('overview');assert.deepEqual(c.get(),before);
    viewport.clientWidth=912;viewport.clientHeight=726;resize();c.refresh('overview');assert.deepEqual(c.get(),before);
    c.refresh('color');c.refresh('overview');assert.deepEqual(c.get(),before);
  } finally {globalThis.ResizeObserver=previous;}
});
