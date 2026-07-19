import { describe, expect, it } from 'vitest';
import { getQuizLanguageLabels } from './quiz-language-labels';

describe('getQuizLanguageLabels', () => {
  it('uses the deck languages for a front-to-back question', () => {
    expect(getQuizLanguageLabels('ftb', 'nb', 'en')).toEqual({
      promptLabel: 'Norwegian Bokmål',
      answerLabel: 'English',
      directionLabel: 'Norwegian Bokmål to English',
      answerInstruction: 'Type your answer in English',
      promptRowLabel: 'Norwegian Bokmål shown',
      correctAnswerRowLabel: 'Correct answer (English)',
    });
  });

  it('reverses the language labels for a back-to-front question', () => {
    expect(getQuizLanguageLabels('btf', 'nb', 'en')).toMatchObject({
      promptLabel: 'English',
      answerLabel: 'Norwegian Bokmål',
      directionLabel: 'English to Norwegian Bokmål',
    });
  });

  it('uses learner-friendly fallbacks when languages are not configured', () => {
    expect(getQuizLanguageLabels('ftb', null, null)).toEqual({
      promptLabel: 'Prompt',
      answerLabel: 'Answer',
      directionLabel: 'Translation',
      answerInstruction: 'Type your answer',
      promptRowLabel: 'Prompt',
      correctAnswerRowLabel: 'Correct answer',
    });
  });
});
