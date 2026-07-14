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
  const languagesHeadingId = `${idPrefix}-languages-heading`;

  return (
    <div className="space-y-5">
      <div className="form-field">
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

      <div className="form-field">
        <div className="form-field__label-row">
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

      <section className="border-t border-default-200 pt-5" aria-labelledby={languagesHeadingId}>
        <div className="form-field__label-row">
          <h3 id={languagesHeadingId} className="text-sm font-medium text-default-700">
            Languages
          </h3>
          <span className="text-xs text-default-400">Optional</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-default-500">
          Label the prompt and answer sides, or leave them unspecified for mixed-language decks.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
      </section>
    </div>
  );
}
