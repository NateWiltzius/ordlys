import { describe, expect, it } from 'vitest';
import { hasSpeechSynthesisApi } from './browser-speech-player';
import { getVoiceLanguageCandidates, selectSpeechVoice, type SpeechVoice } from './voice-selection';

function voice(lang: string, name: string): SpeechVoice {
  return { lang, name, voiceURI: `${lang}:${name}` };
}

describe('getVoiceLanguageCandidates', () => {
  it('prefers Bokmal voices before generic Norwegian and Nynorsk fallbacks', () => {
    expect(getVoiceLanguageCandidates('nb')).toEqual(['nb-NO', 'nb', 'no-NO', 'no', 'nn-NO', 'nn']);
  });

  it('prefers Nynorsk voices before generic Norwegian and Bokmal fallbacks', () => {
    expect(getVoiceLanguageCandidates('nn-NO')).toEqual([
      'nn-NO',
      'nn',
      'no-NO',
      'no',
      'nb-NO',
      'nb',
    ]);
  });
});

describe('selectSpeechVoice', () => {
  it('selects the preferred Bokmal locale regardless of browser voice ordering', () => {
    const voices = [voice('no-NO', 'Generic'), voice('nb', 'Short'), voice('nb-NO', 'Local')];

    expect(selectSpeechVoice(voices, 'nb')?.name).toBe('Local');
  });

  it('selects Nynorsk before generic Norwegian', () => {
    const voices = [voice('no-NO', 'Generic'), voice('nn-NO', 'Nynorsk')];

    expect(selectSpeechVoice(voices, 'nn')?.name).toBe('Nynorsk');
  });

  it('uses generic Norwegian as a compatibility fallback', () => {
    const voices = [voice('en-US', 'English'), voice('no-NO', 'Norwegian')];

    expect(selectSpeechVoice(voices, 'nb')?.name).toBe('Norwegian');
  });

  it('prefers an exact locale before another voice in the same language', () => {
    const voices = [voice('pt-PT', 'Portugal'), voice('pt-BR', 'Brazil')];

    expect(selectSpeechVoice(voices, 'pt-BR')?.name).toBe('Brazil');
  });

  it('selects a same-language fallback deterministically', () => {
    const voices = [voice('fr-FR', 'France'), voice('fr-CA', 'Canada')];

    expect(selectSpeechVoice(voices, 'fr-BE')?.name).toBe('Canada');
    expect(selectSpeechVoice([...voices].reverse(), 'fr-BE')?.name).toBe('Canada');
  });

  it('does not use an unrelated default voice for an unsupported language', () => {
    expect(selectSpeechVoice([voice('en-US', 'Default')], 'ja')).toBeNull();
    expect(selectSpeechVoice([voice('en-US', 'Default')], null)).toBeNull();
  });
});

describe('hasSpeechSynthesisApi', () => {
  it('reports an unavailable or incomplete browser API', () => {
    expect(hasSpeechSynthesisApi(undefined)).toBe(false);
    expect(hasSpeechSynthesisApi({ speechSynthesis: {} })).toBe(false);
  });
});
