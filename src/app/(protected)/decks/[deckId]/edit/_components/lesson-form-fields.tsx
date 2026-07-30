import { CONTENT_LIMITS } from '@/lib/validation/content';
import { Input, Label } from '@heroui/react';

type Props = {
  id: string;
  defaultTitle?: string;
  autoFocus?: boolean;
  label?: string;
  helpText?: string;
  name?: string;
};

export default function LessonFormFields({
  id,
  defaultTitle,
  autoFocus = false,
  label = 'Lesson title',
  helpText = 'Use a short, specific name that makes the lesson easy to recognize.',
  name = 'title',
}: Props) {
  return (
    <div className="form-field">
      <Label className="text-sm text-default-600" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        placeholder="e.g. Present tense verbs"
        defaultValue={defaultTitle}
        required
        maxLength={CONTENT_LIMITS.lessonTitle}
        className="w-full"
        autoFocus={autoFocus}
      />
      <p className="text-xs leading-5 text-default-500">{helpText}</p>
    </div>
  );
}
