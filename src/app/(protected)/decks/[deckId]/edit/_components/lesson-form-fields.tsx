import { CONTENT_LIMITS } from '@/lib/validation/content';
import { Input, Label } from '@heroui/react';

type Props = {
  id: string;
  defaultTitle?: string;
  autoFocus?: boolean;
};

export default function LessonFormFields({ id, defaultTitle, autoFocus = false }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-default-600" htmlFor={id}>
        Lesson title
      </Label>
      <Input
        id={id}
        name="title"
        placeholder="e.g. Present tense verbs"
        defaultValue={defaultTitle}
        required
        maxLength={CONTENT_LIMITS.lessonTitle}
        className="w-full"
        autoFocus={autoFocus}
      />
      <p className="text-xs leading-5 text-default-500">
        Use a short, specific name that makes the lesson easy to recognize.
      </p>
    </div>
  );
}
