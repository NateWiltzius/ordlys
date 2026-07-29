export type SpeechAvailability = 'available' | 'api-unavailable' | 'voice-unavailable';

export type SpeechPlaybackRequest = {
  text: string;
  language: string | null;
  onStart: () => void;
  onEnd: () => void;
  onStop: () => void;
  onError: (message: string) => void;
};

export type SpeechPlayback = {
  stop: () => void;
};

export interface SpeechPlayer {
  getAvailability: (language: string | null) => SpeechAvailability;
  subscribeAvailability: (listener: () => void) => () => void;
  play: (request: SpeechPlaybackRequest) => SpeechPlayback | null;
}
