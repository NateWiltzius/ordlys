'use client';

import DialogActions from '@/components/shared/dialog-actions';

import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { ReactNode } from 'react';

type ConfirmationTone = 'neutral' | 'warning' | 'danger';

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: ConfirmationTone;
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  isPending = false,
  onConfirm,
}: Props) {
  const state = useOverlayState({ isOpen, onOpenChange });
  const iconClassName = {
    neutral: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  }[tone];
  const confirmVariant = {
    neutral: 'primary',
    warning: 'secondary',
    danger: 'danger',
  }[tone] as 'primary' | 'secondary' | 'danger';
  const Icon = tone === 'neutral' ? InformationCircleIcon : ExclamationTriangleIcon;

  return (
    <Modal.Backdrop
      isOpen={state.isOpen}
      onOpenChange={state.setOpen}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <Modal.Container>
        <Modal.Dialog role={tone === 'danger' ? 'alertdialog' : 'dialog'}>
          <Modal.Header>
            <Modal.Icon className={iconClassName}>
              <Icon className="size-5" aria-hidden="true" />
            </Modal.Icon>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="text-sm text-default-600">{description}</p>
          </Modal.Body>
          <DialogActions>
            <Button
              variant="tertiary"
              className="w-full sm:w-auto"
              isDisabled={isPending}
              onPress={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              className="w-full sm:w-auto"
              isPending={isPending}
              onPress={() => void onConfirm()}
            >
              {confirmLabel}
            </Button>
          </DialogActions>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
