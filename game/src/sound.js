// All sound is synthesized with WebAudio — no audio files, no network.
// The game starts muted until the first click or key, as browsers require.
export function createSound() {
  let ctx = null;
  let muted = false;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = AC ? new AC() : null;
    } catch {
      ctx = null;
    }
    return ctx;
  }
  function tone(freq, seconds, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensure();
    if (!audio) return;
    try {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audio.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, audio.currentTime + when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + when + seconds);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + when);
      osc.stop(audio.currentTime + when + seconds + 0.05);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }
  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pick() { tone(520, 0.08, 'triangle', 0.1); },
    place() { tone(340, 0.09, 'triangle', 0.1); tone(520, 0.07, 'triangle', 0.07, 0.05); },
    chop() { tone(220, 0.06, 'square', 0.06); },
    sizzle() { tone(880, 0.12, 'sawtooth', 0.04); tone(660, 0.12, 'sawtooth', 0.04, 0.08); },
    ready() { tone(660, 0.1, 'sine', 0.12); tone(880, 0.14, 'sine', 0.12, 0.09); },
    serve() { tone(523, 0.1, 'sine', 0.12); tone(659, 0.1, 'sine', 0.12, 0.09); tone(784, 0.18, 'sine', 0.12, 0.18); },
    bad() { tone(180, 0.2, 'sawtooth', 0.08); },
    expire() { tone(300, 0.25, 'sine', 0.1); tone(200, 0.3, 'sine', 0.1, 0.15); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.12, i * 0.12)); },
  };
}
