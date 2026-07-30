'use client';

import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { parseAlternatives } from '@/lib/vocab/parse-alternatives';
import { replaceVocabAction, updateVocabAction } from '@/server/vocab.actions';
import type { Vocab } from '@/types/vocab.types';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button, Checkbox, Label, Modal } from '@heroui/react';
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import ShortcutAction from './shortcut-action';
import VocabFormFields from './vocab-form-fields';

type SaveIntent = 'close' | 'previous' | 'next';

type Props = {
  vocab: Vocab | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved: () => void | Promise<void>;
  navigation?: {
    position: number;
    total: number;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onNavigate: (direction: 'previous' | 'next') => void;
  };
};

export default function EditVocabModal({
  vocab,
  isOpen,
  onOpenChange,
  onSaved,
  navigation,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submittingIntent, setSubmittingIntent] = useState<SaveIntent | null>(null);
  const [replaceIdentity, setReplaceIdentity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const isSubmitting = submittingIntent !== null;

  useEffect(() => {
    if (!isOpen) return;
    setReplaceIdentity(false);
    setError(null);
    setIsDirty(false);
    setIsDiscardOpen(false);
  }, [isOpen, vocab?.id]);

  useEffect(() => {
    if (!isOpen || !isDirty) return;

    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isDirty, isOpen]);

  const saveForm = async (form: HTMLFormElement, intent: SaveIntent) => {
    if (isSubmitting) return;

    const formData = new FormData(form);
    const front = String(formData.get('front') ?? '').trim();
    const back = String(formData.get('back') ?? '').trim();
    const reading = String(formData.get('reading') ?? '').trim();
    const frontToBackQuizHint = String(formData.get('frontToBackQuizHint') ?? '').trim();
    const backToFrontQuizHint = String(formData.get('backToFrontQuizHint') ?? '').trim();

    if (!vocab || !front || !back) return;

    try {
      setSubmittingIntent(intent);
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

      setIsDirty(false);
      await onSaved();
      if (intent === 'previous' || intent === 'next') {
        navigation?.onNavigate(intent);
      } else {
        onOpenChange(false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the card.');
    } finally {
      setSubmittingIntent(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveForm(event.currentTarget, 'close');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;

    event.preventDefault();
    const intent = event.shiftKey && navigation?.canGoNext ? 'next' : 'close';
    if (!event.currentTarget.reportValidity()) return;
    void saveForm(event.currentTarget, intent);
  };

  const saveAndNavigate = (intent: 'previous' | 'next') => {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return;
    void saveForm(form, intent);
  };

  const handleOpenChange = (nextIsOpen: boolean) => {
    if (!nextIsOpen && isDirty && !isSubmitting) {
      setIsDiscardOpen(true);
      return;
    }
    onOpenChange(nextIsOpen);
  };

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-2xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <div className="flex items-baseline justify-between gap-4">
                <Modal.Heading>Edit card</Modal.Heading>
                {navigation ? (
                  <span className="shrink-0 text-xs tabular-nums text-default-500">
                    Card {navigation.position} of {navigation.total}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-default-500">
                Update this card, or save and continue through the lesson.
              </p>
            </Modal.Header>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              onChange={() => setIsDirty(true)}
              onKeyDown={handleKeyDown}
              className="mt-2 flex min-h-0 flex-1 flex-col"
            >
              <Modal.Body className="space-y-6">
                {vocab ? <VocabFormFields key={vocab.id} vocab={vocab} /> : null}
                <details className="group overflow-hidden rounded-lg border border-warning/30 bg-warning/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                    <span>
                      <span className="block text-sm font-medium text-default-700">
                        Identity and learner progress
                      </span>
                      <span className="mt-0.5 block text-xs text-default-500">
                        Only use this when the card’s meaning has changed.
                      </span>
                    </span>
                    <ChevronDownIcon
                      className="size-4 shrink-0 text-default-400 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="border-t border-warning/20 p-3">
                    <Checkbox
                      isSelected={replaceIdentity}
                      onChange={setReplaceIdentity}
                      isDisabled={isSubmitting}
                      className="rounded-lg bg-warning/10 p-3"
                    >
                      <Checkbox.Content className="items-start">
                        <Checkbox.Control className="mt-0.5">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Label className="text-sm font-normal">
                          Replace logical identity because the meaning changed. Existing learner
                          progress will not carry to the replacement.
                        </Label>
                      </Checkbox.Content>
                    </Checkbox>
                  </div>
                </details>
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse items-stretch gap-2 min-[560px]:grid min-[560px]:grid-cols-2 min-[640px]:flex min-[640px]:flex-row min-[640px]:flex-wrap min-[640px]:items-center min-[640px]:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-full min-[560px]:shrink-0 min-[640px]:w-auto"
                  isDisabled={isSubmitting}
                  onPress={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                {navigation ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full min-[560px]:shrink-0 min-[640px]:w-auto"
                      isPending={submittingIntent === 'previous'}
                      isDisabled={isSubmitting || !navigation.canGoPrevious}
                      onPress={() => saveAndNavigate('previous')}
                    >
                      Save & previous
                    </Button>
                    <ShortcutAction hint="Ctrl/Cmd + Shift + Enter" fillIntermediate>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        aria-keyshortcuts="Control+Shift+Enter Meta+Shift+Enter"
                        isPending={submittingIntent === 'next'}
                        isDisabled={isSubmitting || !navigation.canGoNext}
                        onPress={() => saveAndNavigate('next')}
                      >
                        Save & next
                      </Button>
                    </ShortcutAction>
                  </>
                ) : null}
                <ShortcutAction hint="Ctrl/Cmd + Enter" fillIntermediate>
                  <Button
                    className="w-full"
                    type="submit"
                    aria-keyshortcuts="Control+Enter Meta+Enter"
                    isPending={submittingIntent === 'close'}
                    isDisabled={isSubmitting}
                  >
                    {replaceIdentity ? 'Replace card' : 'Save changes'}
                  </Button>
                </ShortcutAction>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <ConfirmationDialog
        isOpen={isDiscardOpen}
        onOpenChange={setIsDiscardOpen}
        title="Discard unsaved changes?"
        description="Your edits to this card will be lost."
        confirmLabel="Discard changes"
        tone="warning"
        onConfirm={() => {
          setIsDirty(false);
          setIsDiscardOpen(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
