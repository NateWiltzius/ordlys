'use client';

import { LANGUAGE_OPTIONS } from '@/lib/languages';
import { Label, ListBox, Select } from '@heroui/react';

const NO_LANGUAGE_VALUE = 'not-specified';

type Props = {
  name: 'frontLanguage' | 'backLanguage';
  label: string;
  defaultValue?: string | null;
  isDisabled?: boolean;
};

export default function DeckLanguageSelect({
  name,
  label,
  defaultValue,
  isDisabled = false,
}: Props) {
  const selectedValue = defaultValue || NO_LANGUAGE_VALUE;
  const hasCustomValue =
    selectedValue !== NO_LANGUAGE_VALUE &&
    !LANGUAGE_OPTIONS.some(language => language.code === selectedValue);

  return (
    <Select name={name} defaultValue={selectedValue} isDisabled={isDisabled}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={NO_LANGUAGE_VALUE} textValue="Not specified">
            Not specified
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {hasCustomValue ? (
            <ListBox.Item id={selectedValue} textValue={selectedValue}>
              {selectedValue}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ) : null}
          {LANGUAGE_OPTIONS.map(language => (
            <ListBox.Item key={language.code} id={language.code} textValue={language.name}>
              {language.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function languageFormValue(value: FormDataEntryValue | null): string {
  return value === NO_LANGUAGE_VALUE ? '' : String(value ?? '');
}
