'use client';

import VocabFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/vocab-form-fields';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';
import { replaceVocabAction, updateVocabAction } from '@/server/vocab.actions';
import { Vocab } from '@/types/vocab.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { FormEvent, useEffect, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReplaceIdentity(false);
      setError(null);
    }
  }, [isOpen, vocab?.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const front = String(formData.get('front') ?? '').trim();
    const back = String(formData.get('back') ?? '').trim();
    const reading = String(formData.get('reading') ?? '').trim();
    const frontToBackQuizHint = String(formData.get('frontToBackQuizHint') ?? '').trim();
    const backToFrontQuizHint = String(formData.get('backToFrontQuizHint') ?? '').trim();

    if (!vocab || !front || !back) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const input = {
        front,
        back,
        reading: reading || null,
        frontToBackQuizHint: frontToBackQuizHint || null,
        backToFrontQuizHint: backToFrontQuizHint || null,
        frontAlternatives: parseAlternatives(formData.get('frontAlternatives')),
        backAlternatives: parseAlternatives(formData.get('backAlternatives')),
      };
      const result = replaceIdentity
        ? await replaceVocabAction(vocab.id, input)
        : await updateVocabAction(vocab.id, input);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      await onSaved();
      modalState.close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the vocabulary.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={modalState.isOpen} onOpenChange={modalState.setOpen}>
      <Modal.Container scroll="inside">
        <Modal.Dialog className="sm:max-w-xl">
          <Modal.CloseTrigger />
          <Modal.Header className="space-y-1">
            <Modal.Heading>Edit vocabulary</Modal.Heading>
            <p className="text-sm text-default-500">
              Update the word, quiz hints, and accepted answers.
            </p>
          </Modal.Header>
          <form onSubmit={handleSubmit}>
            <Modal.Body className="space-y-6">
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
              {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
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
  );
}
