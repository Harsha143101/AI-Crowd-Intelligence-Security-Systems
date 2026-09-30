/**
 * AEGIS AI CROWD INTELLIGENCE SECURITY SYSTEM
 * Web Audio API Sound Synthesizer & Speech Voice Announcer
 * 100% Standalone - No external audio files or internet audio needed!
 */

class TacticalAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.speechEnabled = true;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.playBeep(880, 0.08, 'sine');
    }
    return this.isMuted;
  }

  playBeep(freq = 600, duration = 0.1, type = 'sine', volume = 0.15) {
    if (this.isMuted) return;
    this.ensureRunning();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  }

  playRadarPing() {
    if (this.isMuted) return;
    this.ensureRunning();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.25);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playClick() {
    this.playBeep(1200, 0.04, 'triangle', 0.05);
  }

  playWarningBeep() {
    if (this.isMuted) return;
    this.ensureRunning();
    this.playBeep(659.25, 0.12, 'sawtooth', 0.12);
    setTimeout(() => {
      this.playBeep(880, 0.15, 'sawtooth', 0.15);
    }, 120);
  }

  playCriticalAlarm() {
    if (this.isMuted) return;
    this.ensureRunning();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High intensity dual-tone oscillating siren
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Siren sweep
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.linearRampToValueAtTime(1300, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(800, now + 0.4);

      osc2.frequency.setValueAtTime(805, now);
      osc2.frequency.linearRampToValueAtTime(1305, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(805, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {}
  }

  playDispatchConfirmed() {
    this.playBeep(440, 0.1, 'sine', 0.15);
    setTimeout(() => this.playBeep(660, 0.1, 'sine', 0.15), 100);
    setTimeout(() => this.playBeep(880, 0.2, 'sine', 0.2), 200);
  }

  speak(text) {
    if (this.isMuted || !this.speechEnabled) return;
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // cancel pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = 0.8;

      // Select professional English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        (v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Zira')))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }
}

window.tacticalAudio = new TacticalAudio();
