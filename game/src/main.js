// Boot and the one loop for CUTGLASS. Input is read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there.
// ?shot=overview|timing|tool|escape stages that scene from the live systems
// instead of running the loop, paints it twice and sets window.__shotReady.
import { createThreeRoomGallery, PRISM_VALUE, TOOL_BUDGET } from './gallery-level.js';
import { updateThiefMovement } from './player-movement.js';
import { advanceReadableGuardPatrols, createGuardPatrols } from './guard-patrols.js';
import { computeOccludedSecurityVision } from './security-vision.js';
import { updateSharedAlarmMeter } from './alarm-system.js';
import { activateBudgetedHeistTool } from './paid-tools.js';
import { updateStealAndEscapeObjective } from './heist-objective.js';
import { drawCutglassGallery } from './gallery-renderer.js';
import { drawHeistStatusAndToolCosts } from './hud.js';
import { createProceduralHeistAudio } from './procedural-audio.js';
import { runDeterministicScreenshotReplay } from './screenshot-replays.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const audio = createProceduralHeistAudio();

function createHeistState() {
  const gallery = createThreeRoomGallery();
  const state = {
    gallery,
    time: 0,
    tick: 0,
    thief: { x: gallery.spawn.x, y: gallery.spawn.y, radius: 13, facing: -Math.PI / 2, moving: false, sneaking: false, hasPrism: false },
    guards: createGuardPatrols(gallery.guards),
    cameras: gallery.cameras.map((c) => ({ ...c, angle: c.base, loopedUntil: 0, prevSweep: 0 })),
    solids: [...gallery.walls, ...gallery.covers, ...gallery.glass],
    sightSolids: [...gallery.walls, ...gallery.covers],
    smokes: [],
    alarm: 0,
    peakAlarm: 0,
    unseenFor: 99,
    seenBy: null,
    wasSeen: false,
    phase: 'play',
    phaseTime: 0,
    caughtBy: '',
    caughtKind: 'guard',
    budget: TOOL_BUDGET,
    spent: 0,
    toolsUsed: 0,
    selectedTool: 1,
    prismTaken: false,
    holdTime: 0,
    interactTarget: null,
    interactProgress: 0,
    take: 0,
    achievements: { escaped: false, noTools: false, alarmBelow50: false },
    message: '',
    messageUntil: 0,
    onFirstSeen: null,
    onCaught: null,
    onPrismTaken: null,
    onEscaped: null,
  };
  return state;
}

const state = createHeistState();

const keys = { up: false, down: false, left: false, right: false, sneak: false, interact: false };
const mouse = { x: 0, y: 0 };
let canvasRect = null;

function canvasPoint(clientX, clientY) {
  canvasRect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - canvasRect.left) / canvasRect.width) * 1280,
    y: ((clientY - canvasRect.top) / canvasRect.height) * 720,
  };
}

function resetHeist() {
  const fresh = createHeistState();
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
  state.onFirstSeen = () => audio.detection();
  state.onCaught = () => audio.lockdown();
  state.onPrismTaken = () => audio.prismChime();
  state.onEscaped = () => audio.escapeArpeggio();
}

state.onFirstSeen = () => audio.detection();
state.onCaught = () => audio.lockdown();
state.onPrismTaken = () => audio.prismChime();
state.onEscaped = () => audio.escapeArpeggio();

function advanceCameras(dt) {
  for (const camera of state.cameras) {
    const speedUp = state.prismTaken && camera.id === 'CCTV 02' ? 1.8 : 1;
    const period = camera.period / speedUp;
    const sweep = Math.sin((2 * Math.PI * state.time) / period + camera.phase);
    camera.angle = camera.base + camera.amp * sweep;
    // A servo tick each time the sweep reaches a turning point.
    if (Math.abs(sweep) > 0.995 && Math.abs(camera.prevSweep) <= 0.995) audio.servoTick();
    camera.prevSweep = sweep;
  }
}

function stepWorld(dt) {
  state.time += dt;
  state.tick += 1;
  if (state.phase === 'play') {
    advanceCameras(dt);
    advanceReadableGuardPatrols(state.guards, dt);
    updateThiefMovement(state.thief, keys, state.solids, state.gallery.field, dt);
    const sightings = computeOccludedSecurityVision(state, state.sightSolids);
    updateSharedAlarmMeter(state, sightings, dt);
    state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
    updateStealAndEscapeObjective(state, keys.interact, dt);
    // Interact ring progress, from the held time the objective tracks.
    if (state.interactTarget === 'prism') state.interactProgress = Math.min(1, state.holdTime / 1.3);
    else if (state.interactTarget === 'exit') state.interactProgress = Math.min(1, state.holdTime / 0.8);
    else state.interactProgress = 0;
    audio.setTension(state.alarm, !!state.seenBy);
  } else {
    state.phaseTime += dt;
    advanceCameras(dt);
    advanceReadableGuardPatrols(state.guards, dt);
  }
  state.smokes = state.smokes.filter((s) => state.time < s.until);
}

function drawFrame() {
  drawCutglassGallery(ctx, state);
  drawHeistStatusAndToolCosts(ctx, state);
  status.textContent = state.phase === 'play'
    ? `Alarm ${Math.round(state.alarm)} of 100. ${state.prismTaken ? 'Prism secured, return to the dock.' : 'Steal the Heart Prism.'}`
    : state.phase === 'escaped'
      ? `Escaped. Take $${state.take}.`
      : `Caught by ${state.caughtBy}. Press R to try again.`;
}

function useToolAt(point) {
  if (state.phase !== 'play') return;
  const result = activateBudgetedHeistTool(state, state.selectedTool, point.x, point.y);
  state.message = result.message;
  state.messageUntil = state.time + 2.5;
  if (result.ok) audio.toolOk();
  else audio.toolFail();
}

window.addEventListener('keydown', (event) => {
  audio.unlock();
  const k = event.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.up = true;
  else if (k === 's' || k === 'arrowdown') keys.down = true;
  else if (k === 'a' || k === 'arrowleft') keys.left = true;
  else if (k === 'd' || k === 'arrowright') keys.right = true;
  else if (k === 'shift') keys.sneak = true;
  else if (k === 'e') keys.interact = true;
  else if (k === '1') state.selectedTool = 1;
  else if (k === '2') state.selectedTool = 2;
  else if (k === 'm') audio.setMuted(!audio.isMuted());
  else if (k === 'r') resetHeist();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) event.preventDefault();
});
window.addEventListener('keyup', (event) => {
  const k = event.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.up = false;
  else if (k === 's' || k === 'arrowdown') keys.down = false;
  else if (k === 'a' || k === 'arrowleft') keys.left = false;
  else if (k === 'd' || k === 'arrowright') keys.right = false;
  else if (k === 'shift') keys.sneak = false;
  else if (k === 'e') keys.interact = false;
});
canvas.addEventListener('pointerdown', (event) => {
  audio.unlock();
  useToolAt(canvasPoint(event.clientX, event.clientY));
});
canvas.addEventListener('pointermove', (event) => {
  const p = canvasPoint(event.clientX, event.clientY);
  mouse.x = p.x;
  mouse.y = p.y;
});

// Test handle: the playtest drives the real systems through this, never by
// painting anything extra. Not a gameplay feature.
window.__cutglass = {
  state,
  reset: resetHeist,
  step: stepWorld,
  teleport(x, y) { state.thief.x = x; state.thief.y = y; },
  setKeys(next) { Object.assign(keys, next); },
  clickTool(x, y) { useToolAt({ x, y }); },
  prismValue: PRISM_VALUE,
};

export function startCutglassHeist() {
  let accumulator = 0;
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (accumulator >= STEP) {
      stepWorld(STEP);
      accumulator -= STEP;
    }
    drawFrame();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) accumulator = 0;
  });
  requestAnimationFrame(frame);
}

if (shot) {
  runDeterministicScreenshotReplay(shot, state, stepWorld, drawFrame);
} else {
  startCutglassHeist();
}
