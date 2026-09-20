import { Modal } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = { children: ReactNode; layout?: 'standard' | 'extended' };

export default function DialogActions({ children, layout = 'standard' }: Props) {
  return (
    <Modal.Footer
      className={
        layout === 'extended'
          ? 'flex-col-reverse items-stretch gap-2 min-[560px]:grid min-[560px]:grid-cols-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:justify-end'
          : 'flex-col-reverse items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&>button]:w-full sm:[&>button]:w-auto'
      }
    >
      {children}
    </Modal.Footer>
  );
}
