'use client';

import { Button, Tabs } from '@heroui/react';
import { createContext, useContext, useState, type ReactNode } from 'react';

const DeckTabsContext = createContext<{
  expandedKeys: Set<string | number>;
  setExpandedKeys: (keys: Set<string | number>) => void;
  viewLesson: (lessonId: number) => void;
} | null>(null);

export function useDeckTabs() {
  const context = useContext(DeckTabsContext);
  if (!context) throw new Error('Deck tabs context is required');
  return context;
}

export function ViewLessonButton({ lessonId }: { lessonId: number }) {
  const { viewLesson } = useDeckTabs();
  return (
    <Button size="sm" variant="tertiary" onPress={() => viewLesson(lessonId)}>
      View lesson
    </Button>
  );
}

export default function DeckTabs({ study, lessons }: { study: ReactNode; lessons: ReactNode }) {
  const [selectedKey, setSelectedKey] = useState<string | number>('study');
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());

  return (
    <DeckTabsContext.Provider
      value={{
        expandedKeys,
        setExpandedKeys,
        viewLesson: lessonId => {
          setExpandedKeys(new Set([String(lessonId)]));
          setSelectedKey('lessons');
        },
      }}
    >
      <Tabs className="w-full" selectedKey={selectedKey} onSelectionChange={setSelectedKey}>
        <Tabs.ListContainer className="w-full sm:max-w-md">
          <Tabs.List aria-label="Deck sections" className="grid w-full grid-cols-2">
            <Tabs.Tab id="study" className="w-full justify-center">
              Study
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="lessons" className="w-full justify-center">
              Lessons
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="study" className="pt-4">
          {study}
        </Tabs.Panel>
        <Tabs.Panel id="lessons" className="pt-4">
          {lessons}
        </Tabs.Panel>
      </Tabs>
    </DeckTabsContext.Provider>
  );
}
