// Web Audio API Synthesizer for cute companion sounds & UI feedback
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Check saved audio preference
    try {
      const saved = localStorage.getItem('petcraft-sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('petcraft-sound', String(this.enabled));
    } catch {
      // ignore
    }
    if (this.enabled) {
      this.play('ui_click');
    }
    return this.enabled;
  }

  public toggleMute(): boolean {
    return !this.toggleSound();
  }

  public play(type: 'purr' | 'eat' | 'code' | 'celebrate' | 'sleep' | 'special' | 'alert' | 'walk' | 'ui_click' | 'dance', _pitch: number = 1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      switch (type) {
        case 'ui_click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'purr': {
          // Warm frequency modulation purr
          const osc = this.ctx.createOscillator();
          const mod = this.ctx.createOscillator();
          const modGain = this.ctx.createGain();
          const masterGain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);

          mod.type = 'sine';
          mod.frequency.setValueAtTime(24, now); // 24 Hz vibration
          modGain.gain.setValueAtTime(40, now);

          mod.connect(modGain);
          modGain.connect(osc.frequency);

          masterGain.gain.setValueAtTime(0.12, now);
          masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

          osc.connect(masterGain);
          masterGain.connect(this.ctx.destination);

          mod.start(now);
          osc.start(now);
          mod.stop(now + 0.6);
          osc.stop(now + 0.6);
          break;
        }

        case 'eat': {
          // Crunchy cute bubble munch
          [0, 0.08, 0.16].forEach((delay, i) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + delay;
            osc.type = 'sine';
            const baseFreq = 520 + i * 180;
            osc.frequency.setValueAtTime(baseFreq, t);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.04);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.07);
          });
          break;
        }

        case 'code': {
          // Mechanical keyboard clack
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1800, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }

        case 'celebrate': {
          // Arpeggio fanfare
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
          notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.08;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.3);
          });
          break;
        }

        case 'dance': {
          // Bouncy rhythmic groove
          [330, 440, 550, 440].forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.1;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
          });
          break;
        }

        case 'sleep': {
          // Gentle soft sine lullaby
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(392, now); // G4
          osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.5); // C4
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case 'alert': {
          // Double chirp alert
          [0, 0.1].forEach((delay) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + delay;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.08);
          });
          break;
        }

        case 'special': {
          // Cosmic sweep & resonant shimmer
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, now);
          filter.frequency.exponentialRampToValueAtTime(3200, now + 0.4);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case 'walk': {
          // Gentle footsteps
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
      }
    } catch {
      // AudioContext policy or unsupported
    }
  }
}

export const soundFX = new SoundFX();
export const soundEngine = soundFX;

export function playPetSound(
  action: 'idle' | 'walk' | 'sleep' | 'eat' | 'play' | 'dance' | 'code' | 'celebrate' | 'alert' | 'special' | 'pet',
  pitch = 1.0,
  muted = false
): void {
  if (muted) return;
  const mapped =
    action === 'pet'
      ? 'purr'
      : action === 'idle' || action === 'play'
      ? 'ui_click'
      : action;
  soundFX.play(mapped, pitch);
}

