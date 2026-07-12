import { Button, Card, Input } from '@heroui/react';
import { FormEvent, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';
import { useKeepAboveKeyboard } from '@/hooks/use-keep-above-keyboard';
import { getLanguageName } from '@/lib/languages';

type Props = {
  prompt: string;
  answer: string;
  direction: 'btf' | 'ftb';
  frontLanguage: string | null;
  backLanguage: string | null;
  tone: StudyTone;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
};

export default function QuizAnswerForm({
  prompt,
  answer,
  direction,
  frontLanguage,
  backLanguage,
  tone,
  onAnswerChange,
  onSubmit,
}: Props) {
  const answerInputRef = useRef<HTMLInputElement>(null);
  const answerCardRef = useRef<HTMLDivElement>(null);
  const shownSide = direction === 'btf' ? 'back' : 'front';
  const answerSide = direction === 'btf' ? 'front' : 'back';
  const shownLanguage = getLanguageName(direction === 'btf' ? backLanguage : frontLanguage);
  const answerLanguage = getLanguageName(direction === 'btf' ? frontLanguage : backLanguage);
  const shownLabel = sideLabel(shownLanguage, shownSide);
  const answerLabel = sideLabel(answerLanguage, answerSide);
  const answerInstruction = answerLanguage ? `Type in ${answerLanguage}` : `Type the ${answerSide}`;
  useKeepAboveKeyboard(answerInputRef, answerCardRef);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Card ref={answerCardRef} variant="secondary" className="quiz-answer-card w-full">
      <form onSubmit={handleSubmit}>
        <Card.Content className="quiz-answer-content space-y-4">
          <div
            className="overflow-hidden rounded-lg border border-default-200 bg-default-100"
            role="note"
            aria-label={`${shownLabel} shown; type the ${answerLabel}`}
          >
            <div
              className={`flex items-center justify-center gap-3 border-b px-3 py-2 ${STUDY_TONE_STYLES[tone].surface}`}
            >
              <p className="min-w-0 flex-1 text-center text-xs sm:text-sm">
                <span className="text-default-500">Shown: </span>
                <strong className="font-semibold text-default-900">{shownLabel}</strong>
              </p>
              <ArrowRightIcon
                className={`size-4 shrink-0 ${STUDY_TONE_STYLES[tone].text}`}
                aria-hidden="true"
              />
              <p
                className={`min-w-0 flex-1 text-center text-xs sm:text-sm ${STUDY_TONE_STYLES[tone].text}`}
              >
                <span>Type: </span>
                <strong className="font-bold">{answerLabel}</strong>
              </p>
            </div>
            <p className="quiz-answer-prompt break-words px-4 py-6 text-center text-2xl font-semibold">
              {prompt}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{answerInstruction}</p>
            <Input
              ref={answerInputRef}
              aria-label={answerInstruction}
              value={answer}
              onChange={e => onAnswerChange(e.target.value)}
              placeholder="Your answer"
              autoFocus
              fullWidth
            />
          </div>
        </Card.Content>

        <Card.Footer className="quiz-answer-footer">
          <Button
            type="submit"
            variant="primary"
            className={`mt-4 w-full sm:w-auto ${STUDY_TONE_STYLES[tone].button}`}
          >
            Submit answer
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}

function sideLabel(language: string | null, side: 'front' | 'back') {
  const sideName = side === 'front' ? 'Front' : 'Back';
  return language ? `${language} · ${sideName}` : sideName;
}
