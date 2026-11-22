// One shared alarm meter, 0 to 100, for the whole gallery. Being watched fills
// it fast enough to hurt — about 1.4 seconds of open exposure from empty — and
// breaking line of sight gives a short grace before it starts draining again,
// so a near miss is a scare, not a sentence.
const RISE_PER_SECOND = 72;
const RISE_SNEAK_PER_SECOND = 40;
const CAMERA_RISE_PER_SECOND = 60;
const CAMERA_RISE_SNEAK_PER_SECOND = 34;
const DECAY_PER_SECOND = 30;
const GRACE_SECONDS = 1.25;

// Advance the alarm one fixed step. `sightings` is the array from the vision
// module; the nearest watcher sets the pace. Returns 'caught' at 100.
export function updateSharedAlarmMeter(state, sightings, dt) {
  if (state.phase !== 'play') return null;
  if (sightings.length > 0) {
    state.unseenFor = 0;
    const first = sightings[0];
    const sneaking = state.thief.sneaking;
    let rate = first.kind === 'camera'
      ? (sneaking ? CAMERA_RISE_SNEAK_PER_SECOND : CAMERA_RISE_PER_SECOND)
      : (sneaking ? RISE_SNEAK_PER_SECOND : RISE_PER_SECOND);
    state.alarm = Math.min(100, state.alarm + rate * dt);
    state.seenBy = first;
    if (!state.wasSeen) {
      state.wasSeen = true;
      state.onFirstSeen?.();
    }
  } else {
    state.wasSeen = false;
    state.seenBy = null;
    state.unseenFor += dt;
    if (state.unseenFor > GRACE_SECONDS) {
      state.alarm = Math.max(0, state.alarm - DECAY_PER_SECOND * dt);
    }
  }
  if (state.alarm >= 100) {
    state.phase = 'caught';
    state.phaseTime = 0;
    state.caughtBy = state.seenBy ? state.seenBy.id : 'THE GALLERY';
    state.caughtKind = state.seenBy ? state.seenBy.kind : 'guard';
    state.onCaught?.();
    return 'caught';
  }
  return null;
}

// The highest the meter has reached this run; the escape screen's
// "Alarm below 50" achievement reads this, not the final value.
export function peakAlarmSoFar(state) {
  return state.peakAlarm;
}
