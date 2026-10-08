export type TeamSpacePoint = readonly [number, number, number];

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.713 + salt * 37.119) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Stable spatial coordinates for the public team. The golden-angle sphere keeps
 * 20–40 members well distributed while adjacent team-order entries travel in
 * visibly different directions instead of behaving like a horizontal slider.
 */
function greatestCommonDivisor(a: number, b: number) {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) [x, y] = [y, x % y];
  return x;
}

function spatialStep(total: number) {
  if (total <= 1) return 1;
  const preferred = Math.max(1, Math.round(total * 0.38196601125));
  for (let offset = 0; offset < total; offset += 1) {
    for (const candidate of [preferred + offset, preferred - offset]) {
      if (candidate > 0 && candidate < total && greatestCommonDivisor(candidate, total) === 1) {
        return candidate;
      }
    }
  }
  return 1;
}

export function teamSpacePosition(index: number, total: number): TeamSpacePoint {
  const count = Math.max(total, 1);
  // Team order and spatial order are intentionally different. We permute the
  // Fibonacci shell with a coprime step, so pressing “next” can naturally move
  // the camera up, down, sideways or diagonally while every slot remains unique.
  const slot = (index * spatialStep(count)) % count;
  const normalizedY = 1 - ((slot + 0.72) / (count + 0.44)) * 2;
  const radial = Math.sqrt(Math.max(0.08, 1 - normalizedY * normalizedY));
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = slot * goldenAngle + seeded(slot, 8) * 0.2;
  const shell = 4.05 + (seeded(slot, 3) - 0.5) * 0.7;

  return [
    Math.cos(theta) * radial * shell * 1.22,
    normalizedY * 3.65 + (seeded(slot, 5) - 0.5) * 0.38,
    Math.sin(theta) * radial * shell * 0.9 + (seeded(slot, 6) - 0.5) * 0.72,
  ];
}

