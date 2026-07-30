'use client';

import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { MAX_BULK_CARDS, parseBulkCardInput } from '@/lib/vocab/parse-bulk-card-input';
import { createVocabsAction } from '@/server/vocab.actions';
import { Button, Chip, Label, Modal, TextArea } from '@heroui/react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import ShortcutAction from './shortcut-action';

type Props = {
  lessonId: number;
  existingCards: Array<{ front: string; back: string }>;
  onCreated: (vocabIds: number[]) => void | Promise<void>;
};

export default function BulkCreateVocabModal({ lessonId, existingCards, onCreated }: Props) {
  const submissionLocked = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = useMemo(() => parseBulkCardInput(value, existingCards), [existingCards, value]);
  const canSubmit = parsed.cards.length > 0 && !pending;

  useEffect(() => {
    if (!isOpen || !value.trim()) return;

    const preventUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isOpen, value]);

  const closeAndReset = () => {
    setValue('');
    setError(null);
    setIsDiscardOpen(false);
    setIsOpen(false);
  };

  const requestClose = () => {
    if (value.trim() && !pending) {
      setIsDiscardOpen(true);
      return;
    }
    closeAndReset();
  };

  const submit = async () => {
    if (!canSubmit || submissionLocked.current) return;
    submissionLocked.current = true;

    try {
      setPending(true);
      setError(null);
      const result = await createVocabsAction(lessonId, parsed.cards);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      await onCreated(result);
      closeAndReset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the cards.');
    } finally {
      submissionLocked.current = false;
      setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;
    event.preventDefault();
    void submit();
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setError(null);
          setIsOpen(true);
        }}
      >
        Add in bulk
      </Button>

      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={nextIsOpen => {
          if (!nextIsOpen) requestClose();
        }}
        isDismissable={!pending}
        isKeyboardDismissDisabled={pending}
      >
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-3xl">
            {!pending ? <Modal.CloseTrigger /> : null}
            <Modal.Header className="space-y-1">
              <Modal.Heading>Add cards in bulk</Modal.Heading>
              <p className="text-sm text-default-500">
                Paste rows copied from a spreadsheet into this lesson.
              </p>
            </Modal.Header>
            <form
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="mt-2 flex min-h-0 flex-1 flex-col"
              aria-busy={pending}
            >
              <Modal.Body className="space-y-5">
                <div className="form-field">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Label htmlFor="bulk-card-input">Spreadsheet rows</Label>
                    <span className="text-xs text-default-500">
                      Front · Back · Reading (optional)
                    </span>
                  </div>
                  <TextArea
                    id="bulk-card-input"
                    value={value}
                    onChange={event => {
                      setValue(event.target.value);
                      setError(null);
                    }}
                    rows={8}
                    autoFocus
                    disabled={pending}
                    placeholder={'bonjour\thello\nmerci\tthank you\tmehr-see'}
                    className="mt-1 w-full resize-y font-mono text-sm"
                    aria-describedby="bulk-card-help"
                  />
                  <p id="bulk-card-help" className="mt-2 text-xs leading-5 text-default-500">
                    Copy two or three columns from Excel or Google Sheets. Blank lines are ignored,
                    and an optional Front / Back / Reading header is recognized. Maximum{' '}
                    {MAX_BULK_CARDS} cards.
                  </p>
                </div>

                {parsed.batchError ? (
                  <StatusAlert status="danger">{parsed.batchError}</StatusAlert>
                ) : null}
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}

                {parsed.rows.length > 0 ? (
                  <section aria-labelledby="bulk-preview-title" className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 id="bulk-preview-title" className="text-sm font-semibold">
                          Preview
                        </h3>
                        <p className="mt-0.5 text-xs text-default-500">
                          Row numbers match the pasted text.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Chip size="sm" variant="soft">
                          {parsed.rows.length} {parsed.rows.length === 1 ? 'card' : 'cards'}
                        </Chip>
                        {parsed.errorCount > 0 ? (
                          <Chip size="sm" variant="soft" color="danger">
                            {parsed.errorCount} {parsed.errorCount === 1 ? 'issue' : 'issues'}
                          </Chip>
                        ) : null}
                        {parsed.warningCount > 0 ? (
                          <Chip size="sm" variant="soft" color="warning">
                            {parsed.warningCount}{' '}
                            {parsed.warningCount === 1 ? 'warning' : 'warnings'}
                          </Chip>
                        ) : null}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-auto rounded-lg border border-default-200">
                      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-default-100 text-xs text-default-600">
                          <tr>
                            <th className="w-14 px-3 py-2 font-medium">Line</th>
                            <th className="px-3 py-2 font-medium">Front</th>
                            <th className="px-3 py-2 font-medium">Back</th>
                            <th className="px-3 py-2 font-medium">Reading</th>
                            <th className="w-56 px-3 py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-default-200">
                          {parsed.rows.map(row => {
                            const status = [...row.errors, ...row.warnings];
                            return (
                              <tr
                                key={row.lineNumber}
                                className={
                                  row.errors.length
                                    ? 'bg-danger/5'
                                    : row.warnings.length
                                      ? 'bg-warning/5'
                                      : undefined
                                }
                              >
                                <td className="px-3 py-2 align-top tabular-nums text-default-500">
                                  {row.lineNumber}
                                </td>
                                <td className="max-w-56 break-words px-3 py-2 align-top">
                                  {row.front || <span className="text-danger">Missing</span>}
                                </td>
                                <td className="max-w-56 break-words px-3 py-2 align-top">
                                  {row.back || <span className="text-danger">Missing</span>}
                                </td>
                                <td className="max-w-48 break-words px-3 py-2 align-top text-default-600">
                                  {row.reading ?? '—'}
                                </td>
                                <td
                                  className={
                                    row.errors.length
                                      ? 'px-3 py-2 align-top text-xs text-danger'
                                      : row.warnings.length
                                        ? 'px-3 py-2 align-top text-xs text-warning-700'
                                        : 'px-3 py-2 align-top text-xs text-success-700'
                                  }
                                >
                                  {status.length ? status.join(' ') : 'Ready'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {parsed.warningCount > 0 ? (
                      <p className="text-xs leading-5 text-default-500">
                        Warnings do not block creation. Review intentional duplicates before
                        continuing.
                      </p>
                    ) : null}
                  </section>
                ) : (
                  <div className="rounded-lg border border-dashed border-default-300 px-4 py-6 text-center">
                    <p className="text-sm font-medium text-default-700">
                      Your preview will appear here
                    </p>
                    <p className="mt-1 text-xs text-default-500">
                      Paste at least one tab-separated front and back.
                    </p>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse items-stretch gap-2 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-full min-[560px]:w-auto"
                  isDisabled={pending}
                  onPress={requestClose}
                >
                  Cancel
                </Button>
                <ShortcutAction hint="Ctrl/Cmd + Enter">
                  <Button
                    className="w-full"
                    type="submit"
                    aria-keyshortcuts="Control+Enter Meta+Enter"
                    isPending={pending}
                    isDisabled={!canSubmit}
                  >
                    {parsed.cards.length > 0
                      ? `Create ${parsed.cards.length} ${parsed.cards.length === 1 ? 'card' : 'cards'}`
                      : 'Create cards'}
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
        title="Discard pasted cards?"
        description="The cards in this bulk entry will be lost."
        confirmLabel="Discard cards"
        tone="warning"
        onConfirm={closeAndReset}
      />
    </>
  );
}
