// CSS gradient angle (degrees: 0 to top, 90 to right, 180 to bottom) to and from Figma's gradientTransform, the 2×3
// matrix from the unit paint box to gradient space, where the gradient runs along x from 0 to 1 at y = 0.5.
// Pure: publish, readback, compare and CSS share it.
const rad = Math.PI / 180;
const clean = n => Math.abs(n) < 1e-12 ? 0 : n + 0;
const normal = a => clean(((a % 360) + 360) % 360);

// The direction for angle a is (sin a, −cos a) with y down. Gradient x follows it, scaled by the CSS gradient line
// length |sin a| + |cos a| so 0 and 1 land on the box corners as CSS draws them; both rows turn about the centre.
export function angleToTransform(angle) {
  const dx = Math.sin(angle * rad), dy = -Math.cos(angle * rad), length = Math.abs(dx) + Math.abs(dy);
  const a = dx / length, b = dy / length, d = -dy, e = dx;
  return [[a, b, 0.5 - (a + b) / 2], [d, e, 0.5 - (d + e) / 2]].map(row => row.map(clean));
}

// The angle compare uses: normalised to [0, 360) and rounded to 0.001°, past Figma's float32 storage. figma-export.js
// inlines the same rule (it cannot import); tests pin the two together.
export function canonicalAngle(angle) {
  return clean((Math.round(normal(angle) * 1000) / 1000) % 360);
}

// Gradient x grows along (t[0][0], t[0][1]) in the paint box; that direction is the angle, whatever the scale.
export function transformToAngle(t) {
  return normal(Math.atan2(t[0][0], -t[0][1]) / rad);
}

// A radial gradient as ds-create keeps it: {center: [x, y] in 0–1, size: [w, h] > 0 (the ellipse's full width and
// height relative to the layer), rotation in degrees clockwise (optional, 0)}. Figma draws the circle of radius 0.5
// centred on (0.5, 0.5) in gradient space; gradientTransform maps the layer box to that space. The layer offset from
// the centre is turned by −rotation, then divided by the size.
export function radialToTransform({center, size, rotation = 0}) {
  const [x, y] = center, [w, h] = size, c = Math.cos(rotation * rad), s = Math.sin(rotation * rad);
  return [[c / w, s / w, 0.5 - (c * x + s * y) / w], [-s / h, c / h, 0.5 - (-s * x + c * y) / h]].map(row => row.map(clean));
}

// Back from Figma: only a transform with perpendicular axes and a positive determinant (no skew, no mirror) whose
// centre and size meet the draft's rules is a radial ds-create can keep; anything else is unsupported.
export function transformToRadial(t) {
  const [[a, b, tx], [d, e, ty]] = t, det = a * e - b * d, n0 = Math.hypot(a, b), n1 = Math.hypot(d, e);
  if (![a, b, tx, d, e, ty].every(Number.isFinite) || !(det > 0) || !n0 || !n1) return {supported: false, reason: 'The gradient transform is not invertible or is mirrored.'};
  if (Math.abs(a * d + b * e) > 1e-6 * n0 * n1) return {supported: false, reason: 'The gradient is skewed.'};
  // Centre: the layer point that lands on (0.5, 0.5).
  const px = 0.5 - tx, py = 0.5 - ty, x = (e * px - b * py) / det, y = (-d * px + a * py) / det;
  const radial = {center: [x, y].map(clean), size: [1 / n0, 1 / n1].map(clean), rotation: normal(Math.atan2(b, a) / rad)};
  if (!radial.center.every(v => v >= -1e-9 && v <= 1 + 1e-9)) return {supported: false, reason: 'The gradient centre is outside the layer.'};
  radial.center = radial.center.map(v => clean(Math.min(1, Math.max(0, v))));
  return {supported: true, radial};
}

// What compare uses: centre and size to 0.0001, rotation like an angle (0.001°, [0, 360)), past float32 storage.
export function canonicalRadial({center, size, rotation = 0}) {
  const r4 = v => clean(Math.round(v * 10000) / 10000);
  return {center: center.map(r4), size: size.map(r4), rotation: canonicalAngle(rotation)};
}
// Its CSS (radialShape) lives in kit/web/scripts/token-model.mjs, which the site and Builder share.
