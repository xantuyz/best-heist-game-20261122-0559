// Procedural sound, no audio files: a low drone that tightens as the alarm
// climbs, a servo tick when a camera turns, a chime for the prism, a short
// arpeggio for the getaway. Nothing starts until the first click or keypress,
// and M silences it all.
export function createProceduralHeistAudio() {
  let context = null;
  let droneGain = null;
  let droneOsc = null;
  let droneOsc2 = null;
  let muted = false;
  let started = false;

  function ensure() {
    if (started) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      droneGain = context.createGain();
      droneGain.gain.value = 0.0;
      droneGain.connect(context.destination);
      droneOsc = context.createOscillator();
      droneOsc.type = 'sine';
      droneOsc.frequency.value = 55;
      droneOsc.connect(droneGain);
      droneOsc.start();
      droneOsc2 = context.createOscillator();
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.value = 82.5;
      const g2 = context.createGain();
      g2.gain.value = 0.35;
      droneOsc2.connect(g2);
      g2.connect(droneGain);
      droneOsc2.start();
      started = true;
      return true;
    } catch {
      return false;
    }
  }

  function blip(freq, seconds, type, volume, when = 0) {
    if (!started || muted || !context) return;
    try {
      const t = context.currentTime + when;
      const osc = context.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const gain = context.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(t);
      osc.stop(t + seconds + 0.02);
    } catch {
      // Sound is garnish; a failed blip never stops the game.
    }
  }

  return {
    unlock() {
      if (ensure() && context && context.state === 'suspended') context.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
      if (droneGain && context) droneGain.gain.value = muted ? 0 : 0.035;
    },
    isMuted() { return muted; },
    // Called every frame with the live alarm: the drone swells and quickens.
    setTension(alarm, seen) {
      if (!started || !context || !droneGain) return;
      const target = muted ? 0 : 0.028 + (alarm / 100) * 0.05 + (seen ? 0.02 : 0);
      droneGain.gain.setTargetAtTime(target, context.currentTime, 0.2);
      if (droneOsc) droneOsc.frequency.setTargetAtTime(55 + (alarm / 100) * 22, context.currentTime, 0.3);
    },
    servoTick() { blip(190, 0.07, 'square', 0.03); },
    toolOk() { blip(520, 0.12, 'sine', 0.08); blip(780, 0.14, 'sine', 0.06, 0.07); },
    toolFail() { blip(160, 0.16, 'sine', 0.06); },
    detection() { blip(330, 0.1, 'sawtooth', 0.05); blip(440, 0.14, 'sawtooth', 0.05, 0.09); },
    prismChime() { blip(660, 0.25, 'sine', 0.09); blip(880, 0.3, 'sine', 0.08, 0.12); blip(1320, 0.4, 'sine', 0.06, 0.24); },
    escapeArpeggio() {
      [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.28, 'triangle', 0.08, i * 0.11));
    },
    lockdown() { blip(220, 0.4, 'sawtooth', 0.09); blip(110, 0.6, 'sawtooth', 0.09, 0.15); },
  };
}
