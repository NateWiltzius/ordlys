export type SpeechVoice = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'voiceURI'>;

const NORWEGIAN_VOICE_CANDIDATES = {
  nb: ['nb-NO', 'nb', 'no-NO', 'no', 'nn-NO', 'nn'],
  nn: ['nn-NO', 'nn', 'no-NO', 'no', 'nb-NO', 'nb'],
  no: ['no-NO', 'no', 'nb-NO', 'nb', 'nn-NO', 'nn'],
} as const;

function normalizeLanguageTag(language: string) {
  return language.trim().replaceAll('_', '-').toLowerCase();
}

function getPrimaryLanguage(language: string) {
  return normalizeLanguageTag(language).split('-')[0];
}

function compareVoices(left: SpeechVoice, right: SpeechVoice) {
  return (
    normalizeLanguageTag(left.lang).localeCompare(normalizeLanguageTag(right.lang), 'en') ||
    left.name.localeCompare(right.name, 'en') ||
    left.voiceURI.localeCompare(right.voiceURI, 'en')
  );
}

export function getVoiceLanguageCandidates(language: string | null) {
  if (!language?.trim()) return [];

  const normalizedLanguage = normalizeLanguageTag(language);
  const primaryLanguage = getPrimaryLanguage(normalizedLanguage);

  if (primaryLanguage === 'nb' || primaryLanguage === 'nn' || primaryLanguage === 'no') {
    const candidates = NORWEGIAN_VOICE_CANDIDATES[primaryLanguage];

    if (
      normalizedLanguage === primaryLanguage ||
      normalizedLanguage === candidates[0].toLowerCase()
    ) {
      return [...candidates];
    }

    return [language.trim().replaceAll('_', '-'), ...candidates];
  }

  return [language.trim().replaceAll('_', '-')];
}

export function selectSpeechVoice<TVoice extends SpeechVoice>(
  voices: readonly TVoice[],
  language: string | null,
): TVoice | null {
  const candidates = getVoiceLanguageCandidates(language);
  if (candidates.length === 0) return null;

  const normalizedCandidates = candidates.map(normalizeLanguageTag);
  const requestedPrimaryLanguage = getPrimaryLanguage(candidates[0]);
  const isNorwegian = ['nb', 'nn', 'no'].includes(requestedPrimaryLanguage);
  const rankedVoices = voices
    .map(voice => {
      const normalizedVoiceLanguage = normalizeLanguageTag(voice.lang);
      const candidateIndex = normalizedCandidates.indexOf(normalizedVoiceLanguage);
      const isSameLanguage =
        !isNorwegian && getPrimaryLanguage(normalizedVoiceLanguage) === requestedPrimaryLanguage;

      return {
        voice,
        rank: candidateIndex >= 0 ? candidateIndex : isSameLanguage ? candidates.length : -1,
      };
    })
    .filter(({ rank }) => rank >= 0)
    .sort((left, right) => left.rank - right.rank || compareVoices(left.voice, right.voice));

  return rankedVoices[0]?.voice ?? null;
}
