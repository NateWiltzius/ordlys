import { getLanguageName } from '../languages';
import type { QuizDirection } from '../../types/quiz.types';

type QuizLanguageLabels = {
  promptLabel: string;
  answerLabel: string;
  directionLabel: string;
  answerInstruction: string;
  promptRowLabel: string;
  correctAnswerRowLabel: string;
};

export function getQuizLanguageLabels(
  direction: QuizDirection,
  frontLanguage: string | null,
  backLanguage: string | null,
): QuizLanguageLabels {
  const promptLanguage = getLanguageName(direction === 'btf' ? backLanguage : frontLanguage);
  const answerLanguage = getLanguageName(direction === 'btf' ? frontLanguage : backLanguage);
  const promptLabel = promptLanguage ?? 'Prompt';
  const answerLabel = answerLanguage ?? 'Answer';

  return {
    promptLabel,
    answerLabel,
    directionLabel:
      promptLanguage && answerLanguage ? `${promptLanguage} to ${answerLanguage}` : 'Translation',
    answerInstruction: answerLanguage
      ? `Type your answer in ${answerLanguage}`
      : 'Type your answer',
    promptRowLabel: promptLanguage ? `${promptLanguage} shown` : 'Prompt',
    correctAnswerRowLabel: answerLanguage ? `Correct answer (${answerLanguage})` : 'Correct answer',
  };
}
