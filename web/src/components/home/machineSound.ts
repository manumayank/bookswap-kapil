/**
 * Tiny synthesised sound effects for the hero billing machine (no audio files).
 * Browsers only allow audio after the visitor interacts with the page, so the
 * context is created/resumed on the first pointer or key press; until then
 * every call is a silent no-op.
 */
const MUTE_KEY = 'sybrary-machine-muted';

export type MachineSound = {
  click: (strength?: number) => void;
  /** continuous thermal-printer sound for `seconds` */
  printRun: (seconds: number) => void;
  stopPrint: () => void;
  stamp: () => void;
  isMuted: () => boolean;
  /** true once the browser lets audio play (after a first tap/click/key) */
  isUnlocked: () => boolean;
  onUnlock: (cb: () => void) => void;
  setMuted: (m: boolean) => void;
  dispose: () => void;
};

export function createMachineSound(): MachineSound {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let muted = false;
  let current: { stop: () => void } | null = null;
  const unlockCbs: (() => void)[] = [];
  let notified = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {}

  const ensure = () => {
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
    } catch {}
  };
  const notify = () => {
    if (notified || !ctx || ctx.state !== 'running') return;
    notified = true;
    unlockCbs.splice(0).forEach((cb) => cb());
  };
  const unlock = () => {
    ensure();
    try {
      if (ctx && ctx.state === 'suspended') ctx.resume().then(notify).catch(() => {});
      else notify();
    } catch {}
  };
  // Create the context straight away: browsers that already trust this site
  // (e.g. Chrome for frequent visitors) let it run; others start it suspended
  // and it wakes on the first tap, click or key press anywhere on the page.
  ensure();
  const events = ['pointerdown', 'mousedown', 'touchstart', 'keydown'] as const;
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
  // very short high-passed noise tick
  function hp(at: number, dur: number, freq: number, gain: number) {
    const src = ctx!.createBufferSource();
    src.buffer = noise!;
    const f = ctx!.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
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
      const v = 0.94 + Math.random() * 0.12; // slight variation per press
      // soft calculator-key tick: a muted plastic click...
      burst(t, 0.022, 1900 * v, 3.2, 0.42 * strength);
      hp(t, 0.005, 5200, 0.1 * strength);
      // ...with a light low knock as the key lands
      tone(t + 0.006, 0.035, 'sine', 160 * v, 110, 0.16 * strength);
    },
    printRun(seconds) {
      if (!ready()) return;
      this.stopPrint();
      const t = ctx!.currentTime;
      const end = t + seconds;
      const out = ctx!.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(1, t + 0.05);
      out.gain.setValueAtTime(1, end - 0.08);
      out.gain.exponentialRampToValueAtTime(0.0001, end);
      out.connect(master!);
      // paper-feed buzz: band-passed noise chopped by a fast square LFO
      const src = ctx!.createBufferSource();
      src.buffer = noise!;
      src.loop = true;
      const bp = ctx!.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2400;
      bp.Q.value = 0.9;
      const chop = ctx!.createGain();
      chop.gain.value = 0.12;
      const lfo = ctx!.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 11;
      const lfoAmt = ctx!.createGain();
      lfoAmt.gain.value = 0.1;
      lfo.connect(lfoAmt).connect(chop.gain);
      src.connect(bp).connect(chop).connect(out);
      // motor hum underneath
      const hum = ctx!.createOscillator();
      hum.type = 'sawtooth';
      hum.frequency.value = 96;
      const lp = ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const humGain = ctx!.createGain();
      humGain.gain.value = 0.07;
      hum.connect(lp).connect(humGain).connect(out);
      [src, lfo, hum].forEach((n) => { n.start(t); n.stop(end + 0.05); });
      current = { stop: () => { try { out.gain.cancelScheduledValues(ctx!.currentTime); out.gain.setTargetAtTime(0.0001, ctx!.currentTime, 0.03); [src, lfo, hum].forEach((n) => n.stop(ctx!.currentTime + 0.12)); } catch {} } };
    },
    stopPrint() {
      current?.stop();
      current = null;
    },
    stamp() {
      if (!ready()) return;
      const t = ctx!.currentTime;
      tone(t, 0.16, 'sine', 140, 55, 0.6);
      burst(t, 0.08, 600, 0.8, 0.35);
    },
    isMuted: () => muted,
    isUnlocked: () => !!ctx && ctx.state === 'running',
    onUnlock(cb) {
      if (ctx && ctx.state === 'running') cb();
      else unlockCbs.push(cb);
    },
    setMuted(m) {
      muted = m;
      if (m) this.stopPrint();
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
