import CollapsiblePanel from '@/components/shared/collapsible-panel';
import type { ReactNode } from 'react';

type Props = {
  id: string;
  title: string;
  description: string;
  summary?: ReactNode;
  children: ReactNode;
};

export default function CollapsibleSection(props: Props) {
  return <CollapsiblePanel {...props} size="section" />;
}
