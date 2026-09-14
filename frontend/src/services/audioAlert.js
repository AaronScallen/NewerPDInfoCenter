// Tactical Law Enforcement Audio Tone Synthesizer using Web Audio API

let audioCtx = null;
let isMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setAudioMuted(muted) {
  isMuted = muted;
}

export function getAudioMuted() {
  return isMuted;
}

/**
 * Priority 1: 3 Mid-Tone Tactical Alert Beeps (Officer in Distress / Code 3)
 */
export function playCriticalAlertSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playBeep = (startTime, duration = 0.14, freq = 650) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack & decay envelope to eliminate clicking
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.02);
      gain.gain.setValueAtTime(0.28, startTime + duration - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    const beepDuration = 0.14;
    const interval = 0.22; // Beep + silence gap

    // 3 mid-tone beeps (~750 Hz)
    playBeep(now, beepDuration, 650);
    playBeep(now + interval, beepDuration, 650);
    playBeep(now + (interval * 2), beepDuration, 650);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Priority 2: Urgent Double Beep (BOLO / Pursuit)
 */
export function playUrgentAlertSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(950, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.25);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Priority 3: Standard Tactical Notification Chime
 */
export function playStandardNoticeSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

/**
 * Radio Dispatch Acknowledgment Chirp (Click-chirp)
 */
export function playAckChirp() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}
