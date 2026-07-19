'use client';

import { Accordion } from '@heroui/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

type Props = {
  id: string;
  title: string;
  description: string;
  summary?: ReactNode;
  children: ReactNode;
};

export default function CollapsibleSection({ id, title, description, summary, children }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());

  return (
    <section className="border-t border-default-200">
      <Accordion
        hideSeparator
        expandedKeys={expandedKeys}
        onExpandedChange={keys => setExpandedKeys(new Set(keys))}
      >
        <Accordion.Item id={id}>
          <Accordion.Heading level={2}>
            <Accordion.Trigger className="bg-transparent px-0 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <span className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-2 text-left">
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">{title}</span>
                  <span className="block text-sm leading-6 font-normal text-default-500">
                    {description}
                  </span>
                </span>
                {summary ? <span className="shrink-0">{summary}</span> : null}
              </span>
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>

          <Accordion.Panel>
            <Accordion.Body className="px-0 pb-0">{children}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </section>
  );
}
