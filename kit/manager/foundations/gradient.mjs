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
