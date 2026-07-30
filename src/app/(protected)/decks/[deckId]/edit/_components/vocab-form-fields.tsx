import { Vocab } from '@/types/vocab.types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Input, Label, TextArea } from '@heroui/react';

type Props = {
  vocab?: Vocab;
  autoFocus?: boolean;
};

export default function VocabFormFields({ vocab, autoFocus = false }: Props) {
  const hasAdvancedValues = Boolean(
    vocab?.reading ||
      vocab?.frontToBackQuizHint ||
      vocab?.backToFrontQuizHint ||
      vocab?.frontAlternatives.length ||
      vocab?.backAlternatives.length,
  );

  return (
    <div className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-default-900">Card content</legend>
        <div className="space-y-4">
          <div className="form-field">
            <Label className="text-sm text-default-600" htmlFor="front">
              Front
            </Label>
            <TextArea
              id="front"
              name="front"
              required
              maxLength={255}
              rows={3}
              placeholder="Question, term, or prompt"
              className="w-full resize-y"
              defaultValue={vocab?.front}
              autoFocus={autoFocus}
            />
          </div>

          <div className="form-field">
            <Label className="text-sm text-default-600" htmlFor="back">
              Back
            </Label>
            <TextArea
              id="back"
              name="back"
              required
              maxLength={255}
              rows={3}
              placeholder="Answer, definition, or response"
              className="w-full resize-y"
              defaultValue={vocab?.back}
            />
          </div>
        </div>
      </fieldset>

      <details
        className="group overflow-hidden rounded-lg border border-default-200"
        open={hasAdvancedValues}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-medium text-default-700">More card options</span>
            <span className="mt-0.5 block text-xs text-default-500">
              Pronunciation, quiz hints, and accepted answers
            </span>
          </span>
          <ChevronDownIcon
            className="size-4 shrink-0 text-default-400 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="space-y-6 border-t border-default-200 px-4 py-5">
          <div className="form-field">
            <Label className="text-sm text-default-600" htmlFor="reading">
              Reading or pronunciation{' '}
              <span className="font-normal text-default-400">(optional)</span>
            </Label>
            <Input
              id="reading"
              name="reading"
              maxLength={255}
              className="w-full"
              defaultValue={vocab?.reading ?? ''}
            />
          </div>

          <fieldset className="space-y-4 border-t border-default-200 pt-5">
            <legend className="px-2 text-sm font-semibold text-default-900">Quiz hints</legend>
            <p className="text-xs leading-5 text-default-500">
              Optional context shown with the prompt. Hints are not included when checking answers.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-field">
                <Label className="text-sm text-default-600" htmlFor="frontToBackQuizHint">
                  Front → back
                </Label>
                <Input
                  id="frontToBackQuizHint"
                  name="frontToBackQuizHint"
                  maxLength={255}
                  placeholder="Hint shown with the front"
                  className="w-full"
                  defaultValue={vocab?.frontToBackQuizHint ?? ''}
                />
              </div>

              <div className="form-field">
                <Label className="text-sm text-default-600" htmlFor="backToFrontQuizHint">
                  Back → front
                </Label>
                <Input
                  id="backToFrontQuizHint"
                  name="backToFrontQuizHint"
                  maxLength={255}
                  placeholder="Hint shown with the back"
                  className="w-full"
                  defaultValue={vocab?.backToFrontQuizHint ?? ''}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-default-200 pt-5">
            <legend className="px-2 text-sm font-semibold text-default-900">
              Accepted alternatives
            </legend>
            <p className="text-xs leading-5 text-default-500">
              Add one extra accepted answer per line.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-field">
                <Label className="text-sm text-default-600" htmlFor="frontAlternatives">
                  Front alternatives
                </Label>
                <TextArea
                  id="frontAlternatives"
                  name="frontAlternatives"
                  rows={3}
                  placeholder="One accepted answer per line"
                  className="w-full"
                  defaultValue={vocab?.frontAlternatives.join('\n')}
                />
              </div>

              <div className="form-field">
                <Label className="text-sm text-default-600" htmlFor="backAlternatives">
                  Back alternatives
                </Label>
                <TextArea
                  id="backAlternatives"
                  name="backAlternatives"
                  rows={3}
                  placeholder="One accepted answer per line"
                  className="w-full"
                  defaultValue={vocab?.backAlternatives.join('\n')}
                />
              </div>
            </div>
          </fieldset>
        </div>
      </details>
    </div>
  );
}
