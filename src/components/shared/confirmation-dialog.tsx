'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { ReactNode } from 'react';

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isPending = false,
  onConfirm,
}: Props) {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <Modal.Container>
        <Modal.Dialog role="alertdialog">
          <Modal.Header>
            <Modal.Icon className="bg-danger/10 text-danger">
              <ExclamationTriangleIcon className="size-5" aria-hidden="true" />
            </Modal.Icon>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="text-sm text-default-600">{description}</p>
          </Modal.Body>
          <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="tertiary"
              className="w-full sm:w-auto"
              isDisabled={isPending}
              onPress={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              isPending={isPending}
              onPress={() => void onConfirm()}
            >
              {confirmLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
