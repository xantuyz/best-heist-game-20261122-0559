// The patrols: three guards walking readable loops, pausing at each corner and
// turning toward the next leg before they set off, so a player can learn the
// rhythm and move in the gaps instead of guessing.
export function createGuardPatrols(defs) {
  return defs.map((def) => {
    const [sx, sy] = def.waypoints[0];
    const [nx, ny] = def.waypoints[1];
    return {
      id: def.id,
      waypoints: def.waypoints,
      speed: def.speed,
      pause: def.pause,
      x: sx,
      y: sy,
      radius: 14,
      leg: 0,
      waiting: 0.6,
      angle: Math.atan2(ny - sy, nx - sx),
      targetAngle: Math.atan2(ny - sy, nx - sx),
    };
  });
}

function turnToward(current, target, maxStep) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

// Advance every guard one fixed step. A guard walks to the next waypoint,
// waits there, turns to face the leg after it, then walks on.
export function advanceReadableGuardPatrols(guards, dt) {
  for (const guard of guards) {
    // A held guard (staged for a screenshot) keeps its pose exactly.
    if (guard.hold) continue;
    if (guard.waiting > 0) {
      guard.waiting -= dt;
      const next = guard.waypoints[(guard.leg + 1) % guard.waypoints.length];
      guard.targetAngle = Math.atan2(next[1] - guard.y, next[0] - guard.x);
      guard.angle = turnToward(guard.angle, guard.targetAngle, 2.2 * dt);
      if (guard.waiting <= 0) guard.waiting = 0;
      continue;
    }
    const target = guard.waypoints[(guard.leg + 1) % guard.waypoints.length];
    const dx = target[0] - guard.x;
    const dy = target[1] - guard.y;
    const dist = Math.hypot(dx, dy);
    const step = guard.speed * dt;
    if (dist <= step) {
      guard.x = target[0];
      guard.y = target[1];
      guard.leg = (guard.leg + 1) % guard.waypoints.length;
      guard.waiting = guard.pause;
    } else {
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
      guard.targetAngle = Math.atan2(dy, dx);
      guard.angle = turnToward(guard.angle, guard.targetAngle, 3.5 * dt);
    }
  }
}
