'use client';

import LessonVocabulary from '@/app/(protected)/decks/[deckId]/_components/lesson-vocabulary';
import ButtonLink from '@/components/shared/button-link';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import { LessonProgress } from '@/types/review.types';
import { Accordion, Chip } from '@heroui/react';
import { useState } from 'react';

type Props = {
  deckId: number;
  lessons: LessonProgress[];
  canStudy: boolean;
  frontLabel: string;
  backLabel: string;
};

export default function LessonsAccordion({
  deckId,
  lessons,
  canStudy,
  frontLabel,
  backLabel,
}: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());

  return (
    <Accordion
      expandedKeys={expandedKeys}
      onExpandedChange={keys => setExpandedKeys(new Set(keys))}
    >
      {lessons.map(lesson => {
        const lessonKey = String(lesson.lessonId);
        const isExpanded = expandedKeys.has(lessonKey);

        return (
          <Accordion.Item key={lesson.lessonId} id={lessonKey}>
            <Accordion.Heading>
              <Accordion.Trigger>
                <span className="flex min-w-0 flex-1 flex-col items-start gap-2 pr-2 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="min-w-0 break-words font-medium">{lesson.lessonTitle}</span>
                  {lesson.totalWords === 0 ? (
                    <Chip size="sm" variant="soft" className="shrink-0">
                      Empty
                    </Chip>
                  ) : lesson.isUnlocked ? (
                    <Chip size="sm" variant="soft" color="success" className="shrink-0">
                      {Math.min(lesson.learnedWords, lesson.requiredWords)} of{' '}
                      {lesson.requiredWords} words strengthened
                    </Chip>
                  ) : (
                    <Chip size="sm" variant="soft" className="shrink-0">
                      Locked
                    </Chip>
                  )}
                </span>
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                {canStudy && lesson.canTakePlacementTest ? (
                  <div className="mb-4 flex justify-end">
                    <ButtonLink
                      href={`/decks/${deckId}/placement/${lesson.lessonId}`}
                      variant="secondary"
                      size="sm"
                    >
                      Take placement test
                    </ButtonLink>
                  </div>
                ) : canStudy && lesson.totalWords > lesson.introducedWords ? (
                  <p className="mb-4 text-right text-sm text-default-500">
                    Strengthen at least {Math.round(LESSON_PROGRESSION_CONFIG.unlockRatio * 100)}%
                    of the previous lesson&apos;s words to unlock this placement test.
                  </p>
                ) : null}
                {lesson.totalWords > 0 ? (
                  <LessonVocabulary
                    deckId={deckId}
                    lessonId={lesson.lessonId}
                    isExpanded={isExpanded}
                    frontLabel={frontLabel}
                    backLabel={backLabel}
                  />
                ) : null}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
