import DeckLanguageSelect from '@/app/(protected)/decks/_components/deck-language-select';
import { CONTENT_LIMITS } from '@/lib/validation/content';
import { Input, Label, TextArea } from '@heroui/react';

type DeckFormDefaults = {
  title: string;
  description: string | null;
  frontLanguage: string | null;
  backLanguage: string | null;
};

type Props = {
  idPrefix: string;
  defaults?: DeckFormDefaults;
  autoFocus?: boolean;
  isDisabled?: boolean;
};

export default function DeckFormFields({
  idPrefix,
  defaults,
  autoFocus = false,
  isDisabled = false,
}: Props) {
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-default-900">Deck details</legend>

        <div className="space-y-1.5">
          <Label className="text-sm text-default-600" htmlFor={titleId}>
            Deck title
          </Label>
          <Input
            id={titleId}
            name="title"
            placeholder="e.g. Norwegian vocabulary"
            defaultValue={defaults?.title}
            required
            maxLength={CONTENT_LIMITS.deckTitle}
            className="w-full"
            autoFocus={autoFocus}
            disabled={isDisabled}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label className="text-sm text-default-600" htmlFor={descriptionId}>
              Description
            </Label>
            <span className="text-xs text-default-400">Optional</span>
          </div>
          <TextArea
            id={descriptionId}
            name="description"
            placeholder="What will learners study in this deck?"
            defaultValue={defaults?.description ?? ''}
            maxLength={CONTENT_LIMITS.deckDescription}
            rows={3}
            className="w-full"
            disabled={isDisabled}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-default-200 pt-5">
        <legend className="px-2 text-sm font-semibold text-default-900">Languages</legend>
        <p className="text-xs leading-5 text-default-500">
          These labels clarify which side is the prompt and which is the answer. Leave either one
          unspecified when it does not apply.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <DeckLanguageSelect
            name="frontLanguage"
            label="Front language"
            defaultValue={defaults?.frontLanguage}
            isDisabled={isDisabled}
          />
          <DeckLanguageSelect
            name="backLanguage"
            label="Back language"
            defaultValue={defaults?.backLanguage}
            isDisabled={isDisabled}
          />
        </div>
      </fieldset>
    </div>
  );
}
