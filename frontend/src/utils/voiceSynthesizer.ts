import type { CoachPersona } from '../types/chess';

export interface VoiceOptions {
  rate?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 2.0
  volume?: number; // 0 to 1.0
  persona?: CoachPersona;
}

class VoiceSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private isMuted = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.availableVoices = this.synth.getVoices();
  }

  public subscribe(listener: (speaking: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isSpeaking));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public speak(text: string, options: VoiceOptions = {}) {
    if (!this.synth || this.isMuted || !text.trim()) {
      return;
    }

    // Cancel any active speech
    this.stop();

    const cleanText = text
      .replace(/[*#_~`]/g, '') // remove markdown artifacts
      .replace(/(\d+)\./g, '$1.')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Configure persona parameters
    const persona = options.persona || 'grandmaster';
    let pitch = options.pitch || 1.0;
    let rate = options.rate || 1.05;

    if (persona === 'grandmaster') {
      pitch = 0.95;
      rate = 1.0;
    } else if (persona === 'enthusiastic') {
      pitch = 1.15;
      rate = 1.18;
    } else if (persona === 'tactical') {
      pitch = 1.0;
      rate = 1.1;
    }

    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    // Pick best natural voice if available
    if (this.availableVoices.length > 0) {
      const englishVoices = this.availableVoices.filter((v) => v.lang.startsWith('en'));
      const naturalVoice = englishVoices.find((v) =>
        /Natural|Neural|Google|Premium|David|Mark|George/i.test(v.name)
      );
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      } else if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notify();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isSpeaking = false;
      this.notify();
    };

    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.notify();
    }
  }
}

export const voiceSynthesizer = new VoiceSynthesizer();
