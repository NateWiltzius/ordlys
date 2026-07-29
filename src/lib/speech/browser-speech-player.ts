import type {
  SpeechAvailability,
  SpeechPlayback,
  SpeechPlaybackRequest,
  SpeechPlayer,
} from './speech-player';
import { selectSpeechVoice } from './voice-selection';

type SpeechSynthesisEnvironment = {
  speechSynthesis: SpeechSynthesis;
  SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
};

type ActiveSpeech = {
  token: symbol;
  synthesis: SpeechSynthesis;
  utterance: SpeechSynthesisUtterance;
  request: SpeechPlaybackRequest;
};

export function hasSpeechSynthesisApi(
  environment: unknown,
): environment is SpeechSynthesisEnvironment {
  if (!environment || typeof environment !== 'object') return false;

  const candidate = environment as Partial<SpeechSynthesisEnvironment>;
  const synthesis = candidate.speechSynthesis;

  return (
    typeof candidate.SpeechSynthesisUtterance === 'function' &&
    typeof synthesis?.getVoices === 'function' &&
    typeof synthesis.speak === 'function' &&
    typeof synthesis.cancel === 'function' &&
    typeof synthesis.addEventListener === 'function' &&
    typeof synthesis.removeEventListener === 'function'
  );
}

function getBrowserSpeechEnvironment(): SpeechSynthesisEnvironment | null {
  if (typeof window === 'undefined' || !hasSpeechSynthesisApi(window)) return null;
  return window;
}

class BrowserSpeechPlayer implements SpeechPlayer {
  private activeSpeech: ActiveSpeech | null = null;
  private readonly listeners = new Set<() => void>();
  private voiceEventTarget: SpeechSynthesis | null = null;

  private readonly handleVoicesChanged = () => {
    for (const listener of [...this.listeners]) listener();
  };

  getAvailability(language: string | null): SpeechAvailability {
    const environment = getBrowserSpeechEnvironment();
    if (!environment) return 'api-unavailable';

    return selectSpeechVoice(environment.speechSynthesis.getVoices(), language)
      ? 'available'
      : 'voice-unavailable';
  }

  subscribeAvailability(listener: () => void) {
    this.listeners.add(listener);
    this.syncVoiceEventListener();

    return () => {
      this.listeners.delete(listener);
      this.syncVoiceEventListener();
    };
  }

  play(request: SpeechPlaybackRequest): SpeechPlayback | null {
    const environment = getBrowserSpeechEnvironment();
    if (!environment) {
      request.onError('Speech synthesis is not available in this browser.');
      return null;
    }

    const voice = selectSpeechVoice(environment.speechSynthesis.getVoices(), request.language);
    if (!voice) {
      request.onError('No pronunciation voice is installed for this language.');
      return null;
    }

    let utterance: SpeechSynthesisUtterance;
    try {
      utterance = new environment.SpeechSynthesisUtterance(request.text);
    } catch (error) {
      request.onError(getSpeechErrorMessage(error));
      return null;
    }

    this.stopActiveSpeech();

    const token = Symbol('speech-playback');
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.onstart = () => {
      if (this.activeSpeech?.token === token) request.onStart();
    };
    utterance.onend = () => {
      if (this.clearActiveSpeech(token)) request.onEnd();
    };
    utterance.onerror = event => {
      if (this.clearActiveSpeech(token)) {
        request.onError(`Pronunciation failed (${event.error}).`);
      }
    };

    this.activeSpeech = {
      token,
      synthesis: environment.speechSynthesis,
      utterance,
      request,
    };

    try {
      environment.speechSynthesis.speak(utterance);
    } catch (error) {
      this.clearActiveSpeech(token);
      request.onError(getSpeechErrorMessage(error));
      return null;
    }

    return {
      stop: () => this.stopSpeech(token),
    };
  }

  private syncVoiceEventListener() {
    const nextTarget =
      this.listeners.size > 0 ? (getBrowserSpeechEnvironment()?.speechSynthesis ?? null) : null;

    if (this.voiceEventTarget === nextTarget) return;

    this.voiceEventTarget?.removeEventListener('voiceschanged', this.handleVoicesChanged);
    this.voiceEventTarget = nextTarget;
    this.voiceEventTarget?.addEventListener('voiceschanged', this.handleVoicesChanged);
  }

  private stopSpeech(token: symbol) {
    if (this.activeSpeech?.token !== token) return;
    this.stopActiveSpeech();
  }

  private stopActiveSpeech() {
    const activeSpeech = this.activeSpeech;
    if (!activeSpeech) return;

    this.activeSpeech = null;
    removeUtteranceListeners(activeSpeech.utterance);
    activeSpeech.synthesis.cancel();
    activeSpeech.request.onStop();
  }

  private clearActiveSpeech(token: symbol) {
    if (this.activeSpeech?.token !== token) return false;

    removeUtteranceListeners(this.activeSpeech.utterance);
    this.activeSpeech = null;
    return true;
  }
}

function removeUtteranceListeners(utterance: SpeechSynthesisUtterance) {
  utterance.onstart = null;
  utterance.onend = null;
  utterance.onerror = null;
}

function getSpeechErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? `Pronunciation failed: ${error.message}`
    : 'Pronunciation failed.';
}

export const browserSpeechPlayer: SpeechPlayer = new BrowserSpeechPlayer();
