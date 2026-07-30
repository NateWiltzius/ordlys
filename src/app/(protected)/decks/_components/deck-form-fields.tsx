import DeckLanguageSelect from '@/app/(protected)/decks/_components/deck-language-select';
import { DECK_STUDY_DIRECTION_OPTIONS, type DeckStudyDirection } from '@/lib/deck-study-direction';
import { CONTENT_LIMITS } from '@/lib/validation/content';
import { Input, Label, Radio, RadioGroup, TextArea } from '@heroui/react';

type DeckFormDefaults = {
  title: string;
  description: string | null;
  frontLanguage: string | null;
  backLanguage: string | null;
  studyDirection: DeckStudyDirection;
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-default-700">
          How should cards be tested?
        </legend>
        <RadioGroup
          name="studyDirection"
          defaultValue={defaults?.studyDirection ?? 'both'}
          aria-label="Card testing direction"
          isDisabled={isDisabled}
          variant="secondary"
          className="overflow-hidden rounded-lg border border-default-200 [&_[data-slot=radio]]:mt-0"
        >
          {DECK_STUDY_DIRECTION_OPTIONS.map(option => (
            <Radio
              key={option.value}
              value={option.value}
              className="w-full gap-0 border-b border-default-200 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-default-50 data-[selected]:bg-accent-soft"
            >
              <Radio.Content className="w-full items-start gap-2.5">
                <Radio.Control className="mt-0.5">
                  <Radio.Indicator />
                </Radio.Control>
                <span className="min-w-0">
                  <Label className="block text-sm font-medium text-default-700">
                    {option.label}
                  </Label>
                  <span className="mt-0.5 block text-xs leading-4 text-default-500">
                    {option.description}
                  </span>
                </span>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      </fieldset>

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
