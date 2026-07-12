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
  triggerLabel = 'New vocab',
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
      setError(cause instanceof Error ? cause.message : 'Could not create the vocabulary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button size="sm" variant="secondary" onPress={modalState.open}>
        {triggerLabel}
      </Button>

      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Create Vocab</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleCreateVocab}>
              <Modal.Body className="space-y-6">
                <VocabFormFields />
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full sm:w-auto" type="submit" isDisabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create vocab'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
