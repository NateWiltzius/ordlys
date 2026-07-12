import { Vocab } from '@/types/vocab.types';
import { Input, Label, TextArea } from '@heroui/react';

type Props = {
  vocab?: Vocab;
};

export default function VocabFormFields({ vocab }: Props) {
  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-default-900">Vocabulary</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm text-default-600" htmlFor="front">
              Front
            </Label>
            <Input
              id="front"
              name="front"
              required
              maxLength={255}
              className="w-full"
              defaultValue={vocab?.front}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-default-600" htmlFor="back">
              Back
            </Label>
            <Input
              id="back"
              name="back"
              required
              maxLength={255}
              className="w-full"
              defaultValue={vocab?.back}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-default-600" htmlFor="reading">
            Reading
          </Label>
          <Input
            id="reading"
            name="reading"
            maxLength={255}
            className="w-full"
            defaultValue={vocab?.reading ?? ''}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-default-200 pt-5">
        <legend className="px-2 text-sm font-semibold text-default-900">Quiz hints</legend>
        <p className="text-xs leading-5 text-default-500">
          Optional context shown with the prompt. Hints are not included when checking answers.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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
  );
}
