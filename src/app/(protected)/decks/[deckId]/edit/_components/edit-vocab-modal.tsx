'use client';

import VocabFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/vocab-form-fields';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';
import { replaceVocabAction, updateVocabAction } from '@/server/vocab.actions';
import { Vocab } from '@/types/vocab.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { FormEvent, useEffect, useState } from 'react';

type Props = {
  vocab: Vocab | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved: () => void | Promise<void>;
};

export default function EditVocabModal({ vocab, isOpen, onOpenChange, onSaved }: Props) {
  const modalState = useOverlayState({ isOpen, onOpenChange });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replaceIdentity, setReplaceIdentity] = useState(false);

  useEffect(() => {
    if (isOpen) setReplaceIdentity(false);
  }, [isOpen, vocab?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const front = String(formData.get('front') ?? '').trim();
    const back = String(formData.get('back') ?? '').trim();
    const reading = String(formData.get('reading') ?? '').trim();

    if (!vocab || !front || !back) return;

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
      await onSaved();
      modalState.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit vocabulary</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
              <Modal.Body>
                {vocab ? <VocabFormFields key={vocab.id} vocab={vocab} /> : null}
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
                <Button className="w-full sm:w-auto" type="submit" isPending={isSubmitting}>
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
