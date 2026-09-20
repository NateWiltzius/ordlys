import PageSection from '@/components/shared/layout/page-section';
import { Chip } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  lessonCount: number;
};

export default function LessonsSection({ children, lessonCount }: Props) {
  return (
    <PageSection
      title="Lessons"
      className="border-t-0 pt-0"
      description="Search this deck or open a lesson to browse its cards."
      action={
        <Chip size="sm" variant="soft">
          {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
        </Chip>
      }
    >
      {children}
    </PageSection>
  );
}
