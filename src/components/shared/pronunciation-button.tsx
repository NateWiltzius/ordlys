'use client';

import { SpeakerWaveIcon, SpeakerXMarkIcon, StopIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { browserSpeechPlayer } from '@/lib/speech/browser-speech-player';
import type { SpeechAvailability, SpeechPlayback, SpeechPlayer } from '@/lib/speech/speech-player';

type Props = {
  text: string;
  language: string | null;
  label?: string;
  className?: string;
  player?: SpeechPlayer;
};

type PlaybackState = 'idle' | 'playing';

export default function PronunciationButton({
  text,
  language,
  label = 'Pronunciation',
  className = '',
  player = browserSpeechPlayer,
}: Props) {
  const [availability, setAvailability] = useState<SpeechAvailability | 'checking'>('checking');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const playbackRef = useRef<SpeechPlayback | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setAvailability(player.getAvailability(language));
    setPlaybackState('idle');
    setErrorMessage(null);

    const unsubscribe = player.subscribeAvailability(() => {
      if (mountedRef.current) setAvailability(player.getAvailability(language));
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
      playbackRef.current?.stop();
      playbackRef.current = null;
    };
  }, [language, player, text]);

  const stopPlayback = () => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setPlaybackState('idle');
  };

  const startPlayback = () => {
    setErrorMessage(null);
    setPlaybackState('playing');

    const playback = player.play({
      text,
      language,
      onStart: () => {
        if (mountedRef.current) setPlaybackState('playing');
      },
      onEnd: () => {
        playbackRef.current = null;
        if (mountedRef.current) setPlaybackState('idle');
      },
      onStop: () => {
        playbackRef.current = null;
        if (mountedRef.current) setPlaybackState('idle');
      },
      onError: message => {
        playbackRef.current = null;
        if (!mountedRef.current) return;
        setPlaybackState('idle');
        setErrorMessage(message);
      },
    });

    playbackRef.current = playback;
    if (!playback) setPlaybackState('idle');
  };

  const isPlaying = playbackState === 'playing';
  const isAvailable = availability === 'available';
  const unavailableReason =
    availability === 'checking'
      ? 'Checking pronunciation availability'
      : availability === 'api-unavailable'
        ? 'Pronunciation unavailable in this browser'
        : 'Pronunciation unavailable for this language';
  const accessibleLabel = isPlaying
    ? `Stop ${label.toLowerCase()}`
    : isAvailable
      ? `Play ${label.toLowerCase()}`
      : unavailableReason;

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <Button
        type="button"
        size="sm"
        variant="tertiary"
        isDisabled={!isAvailable && !isPlaying}
        aria-label={accessibleLabel}
        title={errorMessage ?? accessibleLabel}
        onPress={isPlaying ? stopPlayback : startPlayback}
      >
        {isPlaying ? (
          <StopIcon className="size-4" aria-hidden="true" />
        ) : isAvailable ? (
          <SpeakerWaveIcon className="size-4" aria-hidden="true" />
        ) : (
          <SpeakerXMarkIcon className="size-4" aria-hidden="true" />
        )}
        <span>{isPlaying ? 'Stop' : isAvailable ? 'Listen' : 'Unavailable'}</span>
      </Button>
      {errorMessage ? (
        <span role="alert" className="max-w-64 text-xs text-danger">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
