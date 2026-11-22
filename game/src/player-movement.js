// The thief's feet: read the held keys, walk or sneak, and slide around the
// solid things in the gallery. Glass counts as solid underfoot, exactly like a
// wall, even though a gaze passes through it.
const WALK_SPEED = 150;
const SNEAK_SPEED = 85;

function circleHitsRect(x, y, radius, rect) {
  const nearX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const nearY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  const dx = x - nearX;
  const dy = y - nearY;
  return dx * dx + dy * dy < radius * radius;
}

function pushOutOfRect(body, rect) {
  const nearX = Math.max(rect.x, Math.min(body.x, rect.x + rect.width));
  const nearY = Math.max(rect.y, Math.min(body.y, rect.y + rect.height));
  let dx = body.x - nearX;
  let dy = body.y - nearY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= body.radius * body.radius) return;
  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    body.x = nearX + (dx / dist) * body.radius;
    body.y = nearY + (dy / dist) * body.radius;
    return;
  }
  // Centre inside the rect: shove out along the shallowest side.
  const left = body.x - rect.x;
  const right = rect.x + rect.width - body.x;
  const top = body.y - rect.y;
  const bottom = rect.y + rect.height - body.y;
  const shallow = Math.min(left, right, top, bottom);
  if (shallow === left) body.x = rect.x - body.radius;
  else if (shallow === right) body.x = rect.x + rect.width + body.radius;
  else if (shallow === top) body.y = rect.y - body.radius;
  else body.y = rect.y + rect.height + body.radius;
}

// Move the thief one fixed step. `input` carries the held directions and the
// sneak key; `solids` is every rectangle the body cannot pass through.
export function updateThiefMovement(thief, input, solids, field, dt) {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    thief.sneaking = !!input.sneak;
    const speed = thief.sneaking ? SNEAK_SPEED : WALK_SPEED;
    thief.x += dx * speed * dt;
    thief.y += dy * speed * dt;
    thief.facing = Math.atan2(dy, dx);
    thief.moving = true;
  } else {
    thief.moving = false;
    thief.sneaking = !!input.sneak;
  }
  // Keep the thief inside the playfield, then out of every solid.
  const r = thief.radius;
  thief.x = Math.max(field.x + r + 1, Math.min(field.x + field.width - r - 1, thief.x));
  thief.y = Math.max(field.y + r + 1, Math.min(field.y + field.height - r - 1, thief.y));
  for (const solid of solids) {
    if (circleHitsRect(thief.x, thief.y, thief.radius, solid)) pushOutOfRect(thief, solid);
  }
  return moving;
}
