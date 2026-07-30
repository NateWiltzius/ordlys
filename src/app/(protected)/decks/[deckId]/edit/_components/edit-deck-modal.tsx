'use client';

import DeckFormFields from '@/app/(protected)/decks/_components/deck-form-fields';
import { languageFormValue } from '@/app/(protected)/decks/_components/deck-language-select';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { parseDeckStudyDirection } from '@/lib/deck-study-direction';
import { updateDeckAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Props = {
  deck: Deck;
};

export default function EditDeckModal({ deck }: Props) {
  const modalState = useOverlayState();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await updateDeckAction(deck.id, {
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? ''),
        frontLanguage: languageFormValue(formData.get('frontLanguage')),
        backLanguage: languageFormValue(formData.get('backLanguage')),
        studyDirection: parseDeckStudyDirection(formData.get('studyDirection')),
      });
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      modalState.close();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the deck.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal state={modalState}>
      <Button
        variant="secondary"
        onPress={() => {
          setError(null);
          modalState.open();
        }}
      >
        Edit details
      </Button>
      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Edit deck</Modal.Heading>
              <p className="text-sm text-default-500">
                Update the draft details and testing direction. Publish a new release before study
                changes take effect.
              </p>
            </Modal.Header>
            <form onSubmit={handleSubmit} className="mt-2 flex min-h-0 flex-1 flex-col">
              <Modal.Body className="space-y-6">
                <DeckFormFields idPrefix={`edit-deck-${deck.id}`} defaults={deck} autoFocus />
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-full sm:w-auto"
                  isDisabled={isSubmitting}
                  onPress={modalState.close}
                >
                  Cancel
                </Button>
                <Button className="w-full sm:w-auto" type="submit" isPending={isSubmitting}>
                  Save changes
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
