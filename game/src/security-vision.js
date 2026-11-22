// What the watchers can actually see: a cone of a fixed angle and reach, cut
// short by anything solid between watcher and thief. Glass never cuts a cone.
// The same geometry feeds the renderer, so a cone drawn on screen is exactly
// the cone the alarm uses — nothing the eye trusts is a lie.
export const GUARD_CONE_HALF = (65 * Math.PI) / 360;
export const GUARD_RANGE = 175;
export const CAMERA_CONE_HALF = (40 * Math.PI) / 360;
export const CAMERA_RANGE = 260;

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.width) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.width - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.height) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.height - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

// Is the line of sight between two points open? Solid walls and cover block
// it; smoke clouds block it too; glass does not. A watcher standing inside a
// smoke cloud is blind in every direction, because the segment starts in smoke.
export function lineOfSightOpen(x1, y1, x2, y2, solids, smokes) {
  for (const solid of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return false;
  }
  for (const smoke of smokes) {
    if (segmentPassesCircle(x1, y1, x2, y2, smoke.x, smoke.y, smoke.radius)) return false;
  }
  return true;
}

function segmentPassesCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
}

function watcherSees(watcher, halfAngle, range, thief, solids, smokes) {
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range + thief.radius) return null;
  const bearing = Math.atan2(dy, dx);
  if (angleDifference(bearing, watcher.angle) > halfAngle) return null;
  if (!lineOfSightOpen(watcher.x, watcher.y, thief.x, thief.y, solids, smokes)) return null;
  return { kind: watcher.kind, id: watcher.id, x: watcher.x, y: watcher.y, dist };
}

// Every watcher that can see the thief right now, nearest first. Cameras on a
// loop are blind. Returns an array of sightings (empty when unseen).
export function computeOccludedSecurityVision(state, solids) {
  const seen = [];
  for (const guard of state.guards) {
    const hit = watcherSees(
      { kind: 'guard', id: guard.id, x: guard.x, y: guard.y, angle: guard.angle },
      GUARD_CONE_HALF, GUARD_RANGE, state.thief, solids, state.smokes,
    );
    if (hit) seen.push(hit);
  }
  for (const camera of state.cameras) {
    if (state.time < camera.loopedUntil) continue;
    const hit = watcherSees(
      { kind: 'camera', id: camera.id, x: camera.x, y: camera.y, angle: camera.angle },
      CAMERA_CONE_HALF, CAMERA_RANGE, state.thief, solids, state.smokes,
    );
    if (hit) seen.push(hit);
  }
  seen.sort((a, b) => a.dist - b.dist);
  return seen;
}

// The cone polygon a watcher actually paints: rays stop at the first solid, so
// the drawn cone and the detection cone are the same shape.
export function conePolygon(watcher, halfAngle, range, solids, rays = 26) {
  const points = [{ x: watcher.x, y: watcher.y }];
  for (let i = 0; i <= rays; i += 1) {
    const angle = watcher.angle - halfAngle + (2 * halfAngle * i) / rays;
    let reach = range;
    const ex = watcher.x + Math.cos(angle) * range;
    const ey = watcher.y + Math.sin(angle) * range;
    for (const solid of solids) {
      const hit = rayRectDistance(watcher.x, watcher.y, Math.cos(angle), Math.sin(angle), solid);
      if (hit !== null && hit < reach) reach = hit;
    }
    points.push({ x: watcher.x + Math.cos(angle) * reach, y: watcher.y + Math.sin(angle) * reach });
  }
  return points;
}

function rayRectDistance(ox, oy, dx, dy, rect) {
  let tMin = 0;
  let tMax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < rect.x || ox > rect.x + rect.width) return null;
  } else {
    let t1 = (rect.x - ox) / dx;
    let t2 = (rect.x + rect.width - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < rect.y || oy > rect.y + rect.height) return null;
  } else {
    let t1 = (rect.y - oy) / dy;
    let t2 = (rect.y + rect.height - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}
