// The job itself: hold E at the pedestal to lift the prism, then carry it back
// to the dock and hold E again to get out. Taking the prism wakes the vault
// camera up — it sweeps faster from then on, and the game says so out loud.
export const PRISM_HOLD_SECONDS = 1.3;
export const EXIT_HOLD_SECONDS = 0.8;

function nearThief(state, x, y, radius) {
  return Math.hypot(state.thief.x - x, state.thief.y - y) < radius;
}

// Advance the steal-and-escape objective one fixed step. `holdingE` is whether
// the interact key is down this step. Returns 'escaped' on a clean getaway.
export function updateStealAndEscapeObjective(state, holdingE, dt) {
  if (state.phase !== 'play') return null;
  const prism = state.gallery.prism;
  const exit = state.gallery.exit;
  state.interactTarget = null;
  state.interactProgress = 0;
  if (!state.prismTaken && nearThief(state, prism.x, prism.y, 62)) {
    state.interactTarget = 'prism';
    if (holdingE) {
      state.holdTime += dt;
      if (state.holdTime >= PRISM_HOLD_SECONDS) {
        state.prismTaken = true;
        state.holdTime = 0;
        state.thief.hasPrism = true;
        state.message = 'PRISM TAKEN — VAULT CAMERA SPEEDING UP';
        state.messageUntil = state.time + 3.5;
        state.onPrismTaken?.();
      }
    } else {
      state.holdTime = 0;
    }
    return null;
  }
  if (state.prismTaken && nearThief(state, exit.x, exit.y, exit.radius + 6)) {
    state.interactTarget = 'exit';
    if (holdingE) {
      state.holdTime += dt;
      if (state.holdTime >= EXIT_HOLD_SECONDS) {
        state.phase = 'escaped';
        state.phaseTime = 0;
        state.take = 600 - state.spent;
        state.achievements.escaped = true;
        state.achievements.noTools = state.toolsUsed === 0;
        state.achievements.alarmBelow50 = state.peakAlarm < 50;
        state.onEscaped?.();
        return 'escaped';
      }
    } else {
      state.holdTime = 0;
    }
    return null;
  }
  state.holdTime = 0;
  return null;
}
