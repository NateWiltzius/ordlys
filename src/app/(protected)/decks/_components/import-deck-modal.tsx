'use client';

import DeckLanguageSelect, {
  languageFormValue,
} from '@/app/(protected)/decks/_components/deck-language-select';
import { importCsvDeckAction } from '@/server/deck-import.actions';
import { Button, Input, Label, Modal, TextArea, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const CSV_TEMPLATE = `front,back,lesson,reading,front_alternatives,back_alternatives
hei,hello,Greetings,,hallo|heisann,
"å spise","to eat",Verbs,,,`;

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
      <Button variant="secondary">Import CSV</Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[520px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Import a CSV deck</Modal.Heading>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="import-title">Deck title</Label>
                  <Input
                    id="import-title"
                    name="title"
                    placeholder="e.g. Norwegian essentials"
                    required
                    maxLength={255}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="import-description">Description</Label>
                  <TextArea
                    id="import-description"
                    name="description"
                    placeholder="What does this deck cover?"
                    maxLength={255}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DeckLanguageSelect name="frontLanguage" label="Front language" />
                  <DeckLanguageSelect name="backLanguage" label="Back language" />
                </div>
                <p className="text-sm text-default-500">
                  Imported decks start private. Publish and choose sharing options after review.
                </p>
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
                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" isPending={pending}>
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
