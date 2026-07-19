'use client';

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LessonProgress } from '@/types/review.types';
import { getCenteredScrollLeft, getLessonJourneyScrollState } from '@/lib/lesson-journey';

type JourneyLesson = Pick<
  LessonProgress,
  'lessonId' | 'lessonTitle' | 'totalWords' | 'introducedWords' | 'isUnlocked'
>;

type Props = {
  lessons: JourneyLesson[];
  currentLessonId: number | null;
  isComplete: boolean;
};

type ScrollState = {
  canScrollBack: boolean;
  canScrollForward: boolean;
};

export default function LessonJourney({ lessons, currentLessonId, isComplete }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollBack: false,
    canScrollForward: false,
  });

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    setScrollState(
      getLessonJourneyScrollState(scroller.scrollLeft, scroller.scrollWidth, scroller.clientWidth),
    );
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const currentLesson = scroller.querySelector<HTMLElement>('[data-current="true"]');
    if (currentLesson) {
      scroller.scrollLeft = getCenteredScrollLeft(
        currentLesson.offsetLeft,
        currentLesson.offsetWidth,
        scroller.clientWidth,
      );
    }

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(scroller);

    return () => resizeObserver.disconnect();
  }, [currentLessonId, lessons.length, updateScrollState]);

  const scrollJourney = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction * Math.max(160, scroller.clientWidth * 0.75),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative px-12">
      <Button
        type="button"
        size="sm"
        variant="tertiary"
        isIconOnly
        className="absolute left-0 top-1/2 z-10 size-11 min-w-11 -translate-y-1/2 border border-default-200 bg-background shadow-sm"
        aria-label="Show earlier lessons"
        isDisabled={!scrollState.canScrollBack}
        onPress={() => scrollJourney(-1)}
      >
        <ChevronLeftIcon className="size-5" aria-hidden="true" />
      </Button>

      <div
        ref={scrollerRef}
        className="overflow-x-auto overscroll-x-contain py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Lesson journey"
        onScroll={updateScrollState}
      >
        <ol className="flex min-w-max items-center">
          {lessons.map((lesson, index) => {
            const isCovered = lesson.introducedWords >= lesson.totalWords;
            const isCurrent = lesson.lessonId === currentLessonId;
            const isActive = isCurrent && !isComplete;

            return (
              <li
                key={lesson.lessonId}
                className="flex items-center"
                title={lesson.lessonTitle}
                data-current={isCurrent ? 'true' : undefined}
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-500/15'
                      : isCovered
                        ? 'border-success bg-success text-white'
                        : lesson.isUnlocked
                          ? 'border-default-300 bg-background text-default-600'
                          : 'border-default-200 bg-default-100 text-default-400'
                  }`}
                  aria-label={`${lesson.lessonTitle}: ${
                    isActive
                      ? 'current'
                      : isCovered
                        ? 'covered'
                        : lesson.isUnlocked
                          ? 'unlocked'
                          : 'locked'
                  }`}
                >
                  {isCovered ? <CheckIcon className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                {index < lessons.length - 1 ? (
                  <span
                    className={`mx-1 h-0.5 w-10 sm:w-14 ${
                      lessons[index + 1]?.isUnlocked ? 'bg-success' : 'bg-default-200'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <Button
        type="button"
        size="sm"
        variant="tertiary"
        isIconOnly
        className="absolute right-0 top-1/2 z-10 size-11 min-w-11 -translate-y-1/2 border border-default-200 bg-background shadow-sm"
        aria-label="Show later lessons"
        isDisabled={!scrollState.canScrollForward}
        onPress={() => scrollJourney(1)}
      >
        <ChevronRightIcon className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
