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
  const languagesHeadingId = `${idPrefix}-card-side-languages-heading`;
  const hasLanguageDefaults = Boolean(defaults?.frontLanguage || defaults?.backLanguage);

  return (
    <div className="space-y-5">
      <div className="form-field">
        <Label className="text-sm text-default-600" htmlFor={titleId}>
          Deck title
        </Label>
        <Input
          id={titleId}
          name="title"
          placeholder="e.g. Biology terms, Spanish verbs, AWS certification"
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

      <details
        className="group border-t border-default-200 pt-5"
        open={hasLanguageDefaults}
        aria-labelledby={languagesHeadingId}
      >
        <summary
          id={languagesHeadingId}
          className="cursor-pointer text-sm font-medium text-default-700 marker:text-default-400"
        >
          Card-side languages <span className="font-normal text-default-400">(optional)</span>
        </summary>
        <p className="mt-2 text-xs leading-5 text-default-500">
          For language-learning decks, label the language used on each side. Leave these blank for
          other subjects.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DeckLanguageSelect
            name="frontLanguage"
            label="Front-side language"
            defaultValue={defaults?.frontLanguage}
            isDisabled={isDisabled}
          />
          <DeckLanguageSelect
            name="backLanguage"
            label="Back-side language"
            defaultValue={defaults?.backLanguage}
            isDisabled={isDisabled}
          />
        </div>
      </details>
    </div>
  );
}
