'use client';

import { Accordion, Card, Chip } from '@heroui/react';
import { ReactNode, useState } from 'react';

type Props = {
  children: ReactNode;
  lessonCount: number;
};

export default function LessonsSection({ children, lessonCount }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <Accordion
        className="w-full"
        expandedKeys={expandedKeys}
        onExpandedChange={keys => setExpandedKeys(new Set(keys))}
      >
        <Accordion.Item id="lessons">
          <Accordion.Heading>
            <Accordion.Trigger>
              <span className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-2 text-left">
                <span>
                  <span className="block text-lg font-semibold">Lessons</span>
                  <span className="block text-sm font-normal text-default-500">
                    The lessons included in this deck.
                  </span>
                </span>

                <Chip size="sm" className="shrink-0">
                  {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                </Chip>
              </span>

              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>

          <Accordion.Panel>
            <Accordion.Body>{children}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Card>
  );
}
