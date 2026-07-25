import { createVocabAction } from '@/server/vocab.actions';
import { CreateVocab } from '@/types/vocab.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { FormEvent, useState } from 'react';
import VocabFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/vocab-form-fields';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

type CreateVocabModalProps = {
  triggerLabel?: string;
  lessonId: number;
  onCreated: () => void | Promise<void>;
};

export default function CreateVocabModal({
  triggerLabel = 'New card',
  lessonId,
  onCreated,
}: CreateVocabModalProps) {
  const modalState = useOverlayState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateVocab = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const front = String(formData.get('front') ?? '').trim();
    const back = String(formData.get('back') ?? '').trim();
    const frontAlternatives = parseAlternatives(formData.get('frontAlternatives'));
    const backAlternatives = parseAlternatives(formData.get('backAlternatives'));
    const reading = String(formData.get('reading') ?? '').trim();
    const frontToBackQuizHint = String(formData.get('frontToBackQuizHint') ?? '').trim();
    const backToFrontQuizHint = String(formData.get('backToFrontQuizHint') ?? '').trim();

    if (!front || !back) {
      return;
    }

    const vocab: CreateVocab = {
      front,
      back,
      frontAlternatives,
      backAlternatives,
      frontToBackQuizHint: frontToBackQuizHint || null,
      backToFrontQuizHint: backToFrontQuizHint || null,
      reading: reading || undefined,
      lessonId,
    };

    setIsSubmitting(true);

    try {
      setError(null);
      const result = await createVocabAction(vocab);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      await onCreated();
      form.reset();
      modalState.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setError(null);
          modalState.open();
        }}
      >
        {triggerLabel}
      </Button>

      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Create card</Modal.Heading>
              <p className="text-sm text-default-500">
                Add a front and back, then configure how the card appears during quizzes.
              </p>
            </Modal.Header>
            <form onSubmit={handleCreateVocab} className="mt-2 flex min-h-0 flex-1 flex-col">
              <Modal.Body className="space-y-6">
                <VocabFormFields />
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
                  Create card
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
