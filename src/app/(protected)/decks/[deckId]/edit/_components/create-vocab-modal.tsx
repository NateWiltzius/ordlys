import { createVocabAction } from '@/server/vocab.actions';
import { CreateVocab } from '@/types/vocab.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import VocabFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/vocab-form-fields';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';

type CreateVocabModalProps = {
  triggerLabel?: string;
  lessonId: number;
};

export default function CreateVocabModal({
  triggerLabel = 'New vocab',
  lessonId,
}: CreateVocabModalProps) {
  const modalState = useOverlayState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreateVocab = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const front = String(formData.get('front') ?? '').trim();
    const back = String(formData.get('back') ?? '').trim();
    const frontAlternatives = parseAlternatives(formData.get('frontAlternatives'));
    const backAlternatives = parseAlternatives(formData.get('backAlternatives'));
    const reading = String(formData.get('reading') ?? '').trim();

    if (!front || !back) {
      return;
    }

    const vocab: CreateVocab = {
      front,
      back,
      frontAlternatives,
      backAlternatives,
      reading: reading || undefined,
      lessonId,
    };

    setIsSubmitting(true);

    try {
      await createVocabAction(vocab);
      form.reset();
      modalState.close();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button variant="secondary" onPress={modalState.open}>
        {triggerLabel}
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Create Vocab</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleCreateVocab}>
              <Modal.Body>
                <VocabFormFields />
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" type="submit" isDisabled={isSubmitting}>
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
