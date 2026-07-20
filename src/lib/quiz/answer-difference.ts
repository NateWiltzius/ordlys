import { normalizeAnswer } from './normalize';

export type AnswerDifferenceSegment = {
  before: string;
  changed: string;
  after: string;
};

export type AnswerDifference = {
  submitted: AnswerDifferenceSegment;
  correct: AnswerDifferenceSegment;
};

function comparableCharacter(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase();
}

export function getAnswerDifference(
  submittedAnswer: string,
  correctAnswer: string,
): AnswerDifference | null {
  if (
    !submittedAnswer.trim() ||
    normalizeAnswer(submittedAnswer) === normalizeAnswer(correctAnswer)
  ) {
    return null;
  }

  const submitted = Array.from(submittedAnswer.trim().normalize('NFKC'));
  const correct = Array.from(correctAnswer.trim().normalize('NFKC'));
  const sharedLength = Math.min(submitted.length, correct.length);
  let prefixLength = 0;

  while (
    prefixLength < sharedLength &&
    comparableCharacter(submitted[prefixLength]) === comparableCharacter(correct[prefixLength])
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < sharedLength - prefixLength &&
    comparableCharacter(submitted[submitted.length - 1 - suffixLength]) ===
      comparableCharacter(correct[correct.length - 1 - suffixLength])
  ) {
    suffixLength += 1;
  }

  const toSegment = (characters: string[]): AnswerDifferenceSegment => ({
    before: characters.slice(0, prefixLength).join(''),
    changed: characters
      .slice(prefixLength, suffixLength === 0 ? characters.length : -suffixLength)
      .join(''),
    after: suffixLength === 0 ? '' : characters.slice(-suffixLength).join(''),
  });

  return {
    submitted: toSegment(submitted),
    correct: toSegment(correct),
  };
}
