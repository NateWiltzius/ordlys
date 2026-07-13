'use client';

import DeckFormFields from '@/app/(protected)/decks/_components/deck-form-fields';
import { languageFormValue } from '@/app/(protected)/decks/_components/deck-language-select';
import { importCsvDeckAction } from '@/server/deck-import.actions';
import { Button, Label, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

const CSV_TEMPLATE = `front,back,lesson,reading,front_alternatives,back_alternatives,front_to_back_quiz_hint,back_to_front_quiz_hint
hei,hello,Greetings,,hallo|heisann,,,
"å spise","to eat",Verbs,,,,,`;

export default function ImportDeckModal() {
  const modalState = useOverlayState();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('frontLanguage', languageFormValue(formData.get('frontLanguage')));
    formData.set('backLanguage', languageFormValue(formData.get('backLanguage')));

    try {
      setPending(true);
      setError(null);
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
      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Import a CSV deck</Modal.Heading>
              <p className="text-sm text-default-500">
                Create a private deck from a structured vocabulary file.
              </p>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="space-y-6">
                <DeckFormFields idPrefix="import-deck" autoFocus />
                <div className="rounded-lg border border-default-200 bg-default-50 p-3 text-sm">
                  <p className="font-medium text-default-700">Starts private</p>
                  <p className="mt-1 text-xs leading-5 text-default-500">
                    Review the imported vocabulary before publishing or choosing sharing options.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="csv-file">CSV file</Label>
                  <input
                    id="csv-file"
                    name="file"
                    type="file"
                    accept=".csv,text/csv"
                    required
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
                    “Imported vocabulary.”
                  </p>
                </div>
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
                <Button type="submit" isPending={pending} className="w-full sm:w-auto">
                  Import deck
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
