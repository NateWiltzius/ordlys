'use client';

import { Card } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  level: 1 | 2;
  className?: string;
};

export default function SemanticCardTitle({ children, level, className }: Props) {
  if (level === 1) {
    return (
      <Card.Title render={props => <h1 {...props} />} className={className}>
        {children}
      </Card.Title>
    );
  }

  return (
    <Card.Title render={props => <h2 {...props} />} className={className}>
      {children}
    </Card.Title>
  );
}
