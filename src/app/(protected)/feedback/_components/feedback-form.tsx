'use client';

import { createFeedbackAction } from '@/server/feedback.actions';
import { CreateFeedbackInput, FeedbackCategory } from '@/types/feedback.types';
import { Button, Input, Label, ListBox, Select, TextArea } from '@heroui/react';
import { FormEvent, useState } from 'react';

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: 'Something is broken',
  confusing: 'Something is confusing',
  feature: 'Feature request',
  content: 'Deck or content feedback',
  other: 'Other',
};

export default function FeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const input: CreateFeedbackInput = {
      category: String(formData.get('category')) as FeedbackCategory,
      message: String(formData.get('message') ?? ''),
      pagePath: String(formData.get('pagePath') ?? ''),
      contactEmail: String(formData.get('contactEmail') ?? ''),
    };

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      await createFeedbackAction(input);
      form.reset();
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex max-w-2xl flex-col gap-5" onSubmit={handleSubmit}>
      <Select name="category" defaultValue="bug">
        <Label className="text-sm text-default-600" htmlFor="category">
          Type
        </Label>
        <Select.Trigger>
          <span className="sr-only">Feedback type</span>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {Object.entries(categoryLabels).map(([id, label]) => (
              <ListBox.Item key={id} id={id} textValue={label}>
                {label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="space-y-2">
        <Label className="text-sm text-default-600" htmlFor="message">
          Feedback
        </Label>
        <TextArea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={8}
          placeholder="What happened, what did you expect, or what would make this better?"
          className="w-full"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm text-default-600" htmlFor="pagePath">
            Page or flow
          </Label>
          <Input
            id="pagePath"
            name="pagePath"
            maxLength={255}
            placeholder="/decks/12/review"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-default-600" htmlFor="contactEmail">
            Contact email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            maxLength={320}
            placeholder="Optional"
            className="w-full"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Thanks, your feedback was saved.
        </p>
      ) : null}

      <div>
        <Button type="submit" variant="primary" isPending={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send feedback'}
        </Button>
      </div>
    </form>
  );
}
