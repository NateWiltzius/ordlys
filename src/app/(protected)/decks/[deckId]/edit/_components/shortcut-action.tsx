import type { ReactNode } from 'react';
import { cn } from '@heroui/react';

type Props = {
  children: ReactNode;
  fillIntermediate?: boolean;
  hint: string;
};

export default function ShortcutAction({ children, fillIntermediate = false, hint }: Props) {
  return (
    <span
      className={cn(
        'group relative block w-full min-[560px]:inline-flex min-[560px]:shrink-0',
        fillIntermediate ? 'min-[560px]:w-full min-[640px]:w-auto' : 'min-[560px]:w-auto',
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {hint}
      </span>
      {children}
    </span>
  );
}
