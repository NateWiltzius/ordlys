'use client';

import DeckFormFields from '@/app/(protected)/decks/_components/deck-form-fields';
import { languageFormValue } from '@/app/(protected)/decks/_components/deck-language-select';
import { importCsvDeckAction } from '@/server/deck-import.actions';
import { Button, Label, Modal, Spinner, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

const CSV_TEMPLATE = `front,back,lesson,reading,front_alternatives,back_alternatives,front_to_back_quiz_hint,back_to_front_quiz_hint
Mitochondrion,Produces ATP,Cell biology,,,,,
"Ohm's law","V = I * R",Physics,,,,,`;

type Props = {
  autoOpen?: boolean;
};

export default function ImportDeckModal({ autoOpen = false }: Props) {
  const modalState = useOverlayState();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionLocked = useRef(false);
  const handledAutoOpen = useRef(false);

  useEffect(() => {
    if (!autoOpen || handledAutoOpen.current) return;

    handledAutoOpen.current = true;
    modalState.open();
    router.replace('/decks', { scroll: false });
  }, [autoOpen, modalState, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLocked.current) return;
    submissionLocked.current = true;

    try {
      setPending(true);
      setError(null);
      const formData = new FormData(event.currentTarget);
      formData.set('frontLanguage', languageFormValue(formData.get('frontLanguage')));
      formData.set('backLanguage', languageFormValue(formData.get('backLanguage')));

      const deckId = await importCsvDeckAction(formData);
      if (isActionFailure(deckId)) {
        setError(deckId.message);
        return;
      }
      modalState.close();
      router.push(`/decks/${deckId}/edit`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import the deck.');
    } finally {
      submissionLocked.current = false;
      setPending(false);
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
        Import CSV
      </Button>
      <Modal.Backdrop isDismissable={!pending} isKeyboardDismissDisabled={pending}>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-xl">
            {!pending ? <Modal.CloseTrigger /> : null}
            <Modal.Header className="space-y-1">
              <Modal.Heading>Import a CSV deck</Modal.Heading>
              <p className="text-sm text-default-500">
                Create a private deck from a structured flashcard file.
              </p>
            </Modal.Header>
            <form
              onSubmit={submit}
              className="mt-2 flex min-h-0 flex-1 flex-col"
              aria-busy={pending}
            >
              <Modal.Body className="space-y-6">
                <DeckFormFields idPrefix="import-deck" autoFocus isDisabled={pending} />
                <div className="rounded-lg border border-default-200 bg-default-50 p-3 text-sm">
                  <p className="font-medium text-default-700">Starts private</p>
                  <p className="mt-1 text-xs leading-5 text-default-500">
                    Review the imported cards before publishing or choosing sharing options.
                  </p>
                </div>
                <div className="form-field">
                  <Label htmlFor="csv-file">CSV file</Label>
                  <input
                    id="csv-file"
                    name="file"
                    type="file"
                    accept=".csv,text/csv"
                    required
                    disabled={pending}
                    className="mt-1 block w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-default-200 file:px-3 file:py-1.5"
                  />
                </div>
                <div className="rounded-xl border border-default-200 bg-default-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">CSV format</h3>
                    <a
                      href={`data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(CSV_TEMPLATE)}`}
                      download="ordlys-deck-template.csv"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Download template
                    </a>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-default-600">
                    The first row contains column names. Each following row becomes one card.{' '}
                    <code>front</code> and <code>back</code> are required; all other columns are
                    optional.
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-default-100 p-3 text-xs leading-5">
                    {CSV_TEMPLATE}
                  </pre>
                  <p className="mt-2 text-xs leading-5 text-default-500">
                    Use <code>|</code> between alternatives. Values containing commas must be
                    wrapped in double quotes. Save files as UTF-8. Blank lessons are placed in
                    “Imported cards.”
                  </p>
                </div>
                {pending ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 p-4"
                  >
                    <Spinner color="accent" size="sm" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-default-700">Importing your deck…</p>
                      <p className="mt-0.5 text-xs leading-5 text-default-500">
                        Large CSV files can take a little while. Keep this window open.
                      </p>
                    </div>
                  </div>
                ) : null}
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-full sm:w-auto"
                  isDisabled={pending}
                  onPress={modalState.close}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isPending={pending}
                  isDisabled={pending}
                  className="w-full sm:w-auto"
                >
                  {pending ? 'Importing deck…' : 'Import deck'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
