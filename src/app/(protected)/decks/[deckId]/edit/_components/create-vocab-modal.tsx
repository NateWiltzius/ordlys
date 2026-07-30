import { createVocabAction } from '@/server/vocab.actions';
import { CreateVocab } from '@/types/vocab.types';
import { Button, Modal } from '@heroui/react';
import { FormEvent, KeyboardEvent, useRef, useState } from 'react';
import VocabFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/vocab-form-fields';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import ShortcutAction from './shortcut-action';

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
  const formRef = useRef<HTMLFormElement>(null);
  const submissionLocked = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submittingIntent, setSubmittingIntent] = useState<'close' | 'add-another' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSubmitting = submittingIntent !== null;

  const createVocabFromForm = async (form: HTMLFormElement, shouldAddAnother: boolean) => {
    if (submissionLocked.current) return;

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

    submissionLocked.current = true;
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

    setSubmittingIntent(shouldAddAnother ? 'add-another' : 'close');

    try {
      setError(null);
      setSuccessMessage(null);
      const result = await createVocabAction(vocab);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      await onCreated();
      form.reset();
      if (shouldAddAnother) {
        setSuccessMessage('Card created. Add the next one when you are ready.');
        requestAnimationFrame(() => {
          const frontField = form.elements.namedItem('front');
          if (frontField instanceof HTMLElement) frontField.focus();
        });
      } else {
        setIsOpen(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the card.');
    } finally {
      submissionLocked.current = false;
      setSubmittingIntent(null);
    }
  };

  const handleCreateVocab = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void createVocabFromForm(event.currentTarget, false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;

    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    void createVocabFromForm(event.currentTarget, event.shiftKey);
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setError(null);
          setSuccessMessage(null);
          setIsOpen(true);
        }}
      >
        {triggerLabel}
      </Button>

      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Create card</Modal.Heading>
              <p className="text-sm text-default-500">
                Add one card or keep this window open to enter several in a row.
              </p>
            </Modal.Header>
            <form
              ref={formRef}
              onSubmit={handleCreateVocab}
              onKeyDown={handleKeyDown}
              className="mt-2 flex min-h-0 flex-1 flex-col"
            >
              <Modal.Body className="space-y-6">
                <VocabFormFields autoFocus />
                {successMessage ? (
                  <StatusAlert status="success">{successMessage}</StatusAlert>
                ) : null}
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse items-stretch gap-2 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-full min-[560px]:w-auto"
                  isDisabled={isSubmitting}
                  onPress={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <ShortcutAction hint="Ctrl/Cmd + Shift + Enter">
                  <Button
                    className="w-full"
                    type="button"
                    variant="secondary"
                    aria-keyshortcuts="Control+Shift+Enter Meta+Shift+Enter"
                    isPending={submittingIntent === 'add-another'}
                    isDisabled={isSubmitting}
                    onPress={() => {
                      const form = formRef.current;
                      if (!form || !form.reportValidity()) return;
                      void createVocabFromForm(form, true);
                    }}
                  >
                    Create & add another
                  </Button>
                </ShortcutAction>
                <ShortcutAction hint="Ctrl/Cmd + Enter">
                  <Button
                    className="w-full"
                    type="submit"
                    aria-keyshortcuts="Control+Enter Meta+Enter"
                    isPending={submittingIntent === 'close'}
                    isDisabled={isSubmitting}
                  >
                    Create card
                  </Button>
                </ShortcutAction>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
