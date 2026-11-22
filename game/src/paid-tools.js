// The two paid tools, bought from the same $100 a run starts with and paid
// for out of the $600 prize at the end. A click that cannot work costs nothing:
// the money only moves when the tool actually lands.
import { lineOfSightOpen } from './security-vision.js';
export const SMOKE_PRICE = 35;
export const LOOP_PRICE = 45;
export const SMOKE_RADIUS = 72;
export const SMOKE_SECONDS = 3;
export const LOOP_SECONDS = 5;
const SMOKE_MAX_ACTIVE = 2;
const TOOL_REACH = 300;
const LOOP_TARGET_RADIUS = 100;

export function toolRemaining(state) {
  return state.budget - state.spent;
}

// Try to use the selected tool at the clicked canvas point. Returns a short
// outcome object the caller turns into a message and a sound; `charged` is 0
// whenever the click was not a valid use.
export function activateBudgetedHeistTool(state, tool, px, py) {
  const field = state.gallery.field;
  const inside = px > field.x && px < field.x + field.width && py > field.y && py < field.y + field.height;
  const reach = Math.hypot(px - state.thief.x, py - state.thief.y);
  if (!inside || reach > TOOL_REACH) {
    return { ok: false, charged: 0, message: 'OUT OF REACH' };
  }
  if (tool === 1) {
    if (toolRemaining(state) < SMOKE_PRICE) return { ok: false, charged: 0, message: 'NOT ENOUGH BUDGET' };
    const active = state.smokes.filter((s) => state.time < s.until);
    if (active.length >= SMOKE_MAX_ACTIVE) return { ok: false, charged: 0, message: 'SMOKE LIMIT — 2 ACTIVE' };
    for (const solid of state.solids) {
      if (px > solid.x - 4 && px < solid.x + solid.width + 4 && py > solid.y - 4 && py < solid.y + solid.height + 4) {
        return { ok: false, charged: 0, message: 'NO ROOM FOR SMOKE THERE' };
      }
    }
    state.smokes.push({ x: px, y: py, radius: SMOKE_RADIUS, until: state.time + SMOKE_SECONDS });
    state.spent += SMOKE_PRICE;
    state.toolsUsed += 1;
    return { ok: true, charged: SMOKE_PRICE, message: 'SMOKE OUT — 3s' };
  }
  if (tool === 2) {
    const camera = state.cameras.find((c) => Math.hypot(c.x - px, c.y - py) < LOOP_TARGET_RADIUS);
    if (!camera) return { ok: false, charged: 0, message: 'AIM AT A CAMERA' };
    if (state.time < camera.loopedUntil) return { ok: false, charged: 0, message: 'ALREADY LOOPED' };
    // A loop is fitted at the camera itself: the thief must be able to see
    // the camera to reach it, not loop it through a wall.
    if (!lineOfSightOpen(state.thief.x, state.thief.y, camera.x, camera.y, state.sightSolids, state.smokes)) {
      return { ok: false, charged: 0, message: 'NO LINE OF SIGHT' };
    }
    if (toolRemaining(state) < LOOP_PRICE) return { ok: false, charged: 0, message: 'NOT ENOUGH BUDGET' };
    camera.loopedUntil = state.time + LOOP_SECONDS;
    state.spent += LOOP_PRICE;
    state.toolsUsed += 1;
    return { ok: true, charged: LOOP_PRICE, message: `CAMERA LOOPED · ${LOOP_SECONDS}s` };
  }
  return { ok: false, charged: 0, message: 'NO SUCH TOOL' };
}
