/**
 * Tiny synthesised sound effects for the hero billing machine (no audio files).
 * Browsers only allow audio after the visitor interacts with the page, so the
 * context is created/resumed on the first pointer or key press; until then
 * every call is a silent no-op.
 */
const MUTE_KEY = 'sybrary-machine-muted';

export type MachineSound = {
  click: (strength?: number) => void;
  printStep: () => void;
  stamp: () => void;
  isMuted: () => boolean;
  setMuted: (m: boolean) => void;
  dispose: () => void;
};

export function createMachineSound(): MachineSound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {}

  const unlock = () => {
    try {
      if (!ctx) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.35;
        master.connect(ctx.destination);
        // 0.5s of white noise, reused by every sound
        noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch {}
  };
  const events = ['pointerdown', 'keydown'] as const;
  events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));

  const ready = () => !muted && ctx && master && noise && ctx.state === 'running';

  // short filtered noise burst
  function burst(at: number, dur: number, freq: number, q: number, gain: number) {
    const src = ctx!.createBufferSource();
    src.buffer = noise!;
    const f = ctx!.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx!.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(master!);
    src.start(at, Math.random() * 0.3);
    src.stop(at + dur + 0.02);
  }
  // short pitched tone
  function tone(at: number, dur: number, type: OscillatorType, from: number, to: number, gain: number) {
    const o = ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, at);
    o.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master!);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  return {
    click(strength = 1) {
      if (!ready()) return;
      const t = ctx!.currentTime;
      burst(t, 0.03, 3200 + Math.random() * 900, 4, 0.5 * strength);
      tone(t, 0.04, 'triangle', 420, 160, 0.18 * strength);
    },
    printStep() {
      if (!ready()) return;
      const t = ctx!.currentTime;
      // thermal print head: a buzzy whirr per paper step
      tone(t, 0.07, 'sawtooth', 190 + Math.random() * 20, 150, 0.06);
      burst(t, 0.06, 1800, 1.4, 0.12);
    },
    stamp() {
      if (!ready()) return;
      const t = ctx!.currentTime;
      tone(t, 0.16, 'sine', 140, 55, 0.6);
      burst(t, 0.08, 600, 0.8, 0.35);
    },
    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch {}
      if (!m) unlock();
    },
    dispose() {
      events.forEach((e) => window.removeEventListener(e, unlock));
      ctx?.close().catch(() => {});
      ctx = null;
    },
  };
}
