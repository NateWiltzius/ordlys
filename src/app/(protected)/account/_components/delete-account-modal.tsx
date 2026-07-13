'use client';

import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { FormEvent, useState } from 'react';
import { deleteAccountAction } from '@/server/auth.actions';
import StatusAlert from '@/components/shared/status-alert';

export default function DeleteAccountModal() {
  const modalState = useOverlayState();
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setConfirmation('');
    setError(null);
    modalState.open();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== 'DELETE' || pending) return;

    setPending(true);
    setError(null);

    try {
      await deleteAccountAction(confirmation);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete your account.');
      setPending(false);
    }
  }

  return (
    <Modal state={modalState}>
      <Button variant="danger-soft" onPress={openModal}>
        Delete account
      </Button>
      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Delete account permanently?</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleSubmit} className="mt-2 flex min-h-0 flex-1 flex-col">
              <Modal.Body className="space-y-4">
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm">
                  <p className="font-medium text-danger">This action cannot be undone.</p>
                  <p className="mt-1 text-default-600">
                    Your sign-in account, follows, reports, and learning history will be removed.
                    Authored deck releases may remain without your account identifier so existing
                    learners and release history are not broken. Download your data first if you
                    want a copy.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="delete-account-confirmation">
                    Type <span className="font-semibold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="delete-account-confirmation"
                    value={confirmation}
                    onChange={event => setConfirmation(event.target.value)}
                    autoComplete="off"
                    disabled={pending}
                    autoFocus
                  />
                </div>
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  onPress={modalState.close}
                  isDisabled={pending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  isPending={pending}
                  isDisabled={confirmation !== 'DELETE'}
                  className="w-full sm:w-auto"
                >
                  Permanently delete account
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
