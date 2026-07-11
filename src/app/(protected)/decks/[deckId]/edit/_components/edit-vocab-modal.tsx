'use client';

import VocabFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/vocab-form-fields';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';
import { replaceVocabAction, updateVocabAction } from '@/server/vocab.actions';
import { Vocab } from '@/types/vocab.types';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Props = {
  vocab: Vocab;
};

export default function EditVocabModal({ vocab }: Props) {
  const modalState = useOverlayState();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replaceIdentity, setReplaceIdentity] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const front = String(formData.get('front') ?? '').trim();
    const back = String(formData.get('back') ?? '').trim();
    const reading = String(formData.get('reading') ?? '').trim();

    if (!front || !back) return;

    try {
      setIsSubmitting(true);
      const input = {
        front,
        back,
        reading: reading || null,
        frontAlternatives: parseAlternatives(formData.get('frontAlternatives')),
        backAlternatives: parseAlternatives(formData.get('backAlternatives')),
      };
      if (replaceIdentity) await replaceVocabAction(vocab.id, input);
      else await updateVocabAction(vocab.id, input);
      modalState.close();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        aria-label={`Edit ${vocab.front}`}
        onPress={modalState.open}
      >
        <PencilSquareIcon className="h-4 w-4" />
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit vocabulary</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
              <Modal.Body>
                <VocabFormFields vocab={vocab} />
                <label className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={replaceIdentity}
                    onChange={event => setReplaceIdentity(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Replace logical identity because the meaning changed. Existing learner progress
                    will not carry to the replacement.
                  </span>
                </label>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" type="submit" isPending={isSubmitting}>
                  {replaceIdentity ? 'Replace vocabulary' : 'Save changes'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
