// The four screenshots, staged from the real systems: each one places the
// thief, the guards and the cameras in a reachable configuration, then runs
// the live update loop for a short settle so the cones, the alarm and the
// messages in the frame are computed by the game itself, not painted on.
// ?shot=overview|timing|tool|escape — any other value is the overview.
const SETTLE_TICKS = 30;

function placeGuard(state, index, x, y, angle) {
  const guard = state.guards[index];
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.targetAngle = angle;
  guard.waiting = 99;
  guard.hold = true;
  guard.leg = 0;
}

function placeCamera(state, index, angle) {
  state.cameras[index].angle = angle;
}

// The cover: the thief waits behind the hall's solid cover while a guard's
// cone sweeps close enough to almost touch them. Alarm sits at 28, held
// because the thief has been out of sight less than the grace window.
function stageOverview(state) {
  state.thief.x = 505;
  state.thief.y = 326;
  state.thief.facing = -Math.PI / 2;
  state.thief.sneaking = true;
  placeGuard(state, 0, 290, 340, Math.PI * 0.9);
  placeGuard(state, 1, 430, 400, -0.15);
  placeGuard(state, 2, 760, 520, Math.PI * 0.6);
  placeCamera(state, 0, 1.35);
  placeCamera(state, 1, 1.75);
  state.alarm = 28;
  state.unseenFor = 0.4;
  state.message = '';
}

// Timing: the thief waits in the lower A–B opening while the hall guard turns
// away and the camera watches the upper route instead.
function stageTiming(state) {
  state.thief.x = 330;
  state.thief.y = 530;
  state.thief.facing = 0;
  state.thief.sneaking = true;
  placeGuard(state, 0, 170, 485, Math.PI);
  placeGuard(state, 1, 585, 475, Math.PI * 0.15);
  placeGuard(state, 2, 875, 370, -Math.PI / 2);
  placeCamera(state, 0, 0.6);
  placeCamera(state, 1, 2.2);
  state.alarm = 12;
  state.unseenFor = 0.4;
  state.message = 'WAIT FOR THE TURN — THEN GO LOW';
  state.messageUntil = state.time + 30;
}

// The tool shot: a smoke cloud hides the crossing, the vault guard waits on
// the far side of it, and the panel shows $65 left after the $35 capsule.
function stageTool(state) {
  state.thief.x = 640;
  state.thief.y = 330;
  state.thief.facing = 0;
  state.thief.sneaking = true;
  placeGuard(state, 0, 160, 230, Math.PI / 2);
  placeGuard(state, 1, 435, 475, -Math.PI / 2);
  placeGuard(state, 2, 880, 380, Math.PI);
  placeCamera(state, 0, 1.1);
  placeCamera(state, 1, 1.9);
  state.smokes = [{ x: 730, y: 330, radius: 72, until: state.time + 30 }];
  state.spent = 35;
  state.toolsUsed = 1;
  state.alarm = 41;
  state.unseenFor = 0.4;
  state.message = 'SMOKE OUT — 3s';
  state.messageUntil = state.time + 30;
}

// The escape: prism carried, thief at the dock threshold, the take-home math
// on the banner, the vault camera still sweeping behind.
function stageEscape(state) {
  state.thief.x = 150;
  state.thief.y = 590;
  state.thief.facing = Math.PI;
  state.thief.hasPrism = true;
  state.prismTaken = true;
  placeGuard(state, 0, 290, 340, -Math.PI / 2);
  placeGuard(state, 1, 595, 330, Math.PI);
  placeGuard(state, 2, 750, 230, Math.PI / 2);
  placeCamera(state, 0, 1.5);
  placeCamera(state, 1, 1.6);
  state.spent = 35;
  state.toolsUsed = 1;
  state.alarm = 33;
  state.unseenFor = 0.4;
  state.phase = 'escaped';
  state.phaseTime = 0;
  state.take = 565;
  state.achievements.escaped = true;
  state.achievements.noTools = false;
  state.achievements.alarmBelow50 = true;
  state.message = '';
}

// Run the named shot: stage it, let the live systems settle for half a
// second of game time, and say when the frame is ready to capture.
export function runDeterministicScreenshotReplay(name, state, stepWorld, drawFrame) {
  const shot = name === 'timing' || name === 'tool' || name === 'escape' ? name : 'overview';
  if (shot === 'timing') stageTiming(state);
  else if (shot === 'tool') stageTool(state);
  else if (shot === 'escape') stageEscape(state);
  else stageOverview(state);
  for (let i = 0; i < SETTLE_TICKS; i += 1) stepWorld(1 / 60);
  let painted = 0;
  function paint() {
    drawFrame();
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
  return shot;
}
