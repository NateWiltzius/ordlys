import CollapsibleSection from '@/components/shared/collapsible-section';
import { Chip } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  lessonCount: number;
};

export default function LessonsSection({ children, lessonCount }: Props) {
  return (
    <CollapsibleSection
      id="lessons"
      title="Lessons"
      description="Open to browse this deck's vocabulary."
      summary={
        <Chip size="sm" variant="soft">
          {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
        </Chip>
      }
    >
      {children}
    </CollapsibleSection>
  );
}
