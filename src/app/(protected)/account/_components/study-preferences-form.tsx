'use client';

import { Button } from '@heroui/react';
import { useState, useTransition } from 'react';
import { saveStudyPreferencesAction } from '@/server/study-preferences.actions';
import type { StudyPreferences } from '@/lib/study-preferences';

export default function StudyPreferencesForm({ preferences }: { preferences: StudyPreferences }) {
  const [strict, setStrict] = useState(preferences.strictProgression);
  const [target, setTarget] = useState(String(preferences.dailyNewWordTarget));
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={event => {
        event.preventDefault();
        setMessage('');
        startTransition(async () => {
          try {
            await saveStudyPreferencesAction({
              strictProgression: strict,
              dailyNewWordTarget: Number(target),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            setMessage('Learning preferences saved.');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Unable to save preferences.');
          }
        });
      }}
    >
      <label className="block space-y-2">
        <span className="font-medium">Lesson progression</span>
        <select
          className="block w-full rounded-lg border border-default-300 bg-background p-2"
          value={strict ? 'strict' : 'guided'}
          onChange={event => setStrict(event.target.value === 'strict')}
        >
          <option value="guided">Guided (recommended)</option>
          <option value="strict">Structured — require 80% Strong</option>
        </select>
      </label>
      <p className="text-sm text-default-500">
        Guided recommends reaching Strong on 80% of a lesson, with a choice to continue early.
        Structured requires that milestone. Lessons you have started or explicitly opened stay
        available.
      </p>
      <label className="block space-y-2">
        <span className="font-medium">Daily new-card target</span>
        <input
          className="block w-28 rounded-lg border border-default-300 bg-background p-2"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          value={target}
          onChange={event => setTarget(event.target.value)}
        />
      </label>
      <p className="text-sm text-default-500">
        Across all decks, including cards placed into review by a placement test. This is a goal,
        not a limit. Saving uses this device’s time zone for your daily progress.
      </p>
      <Button type="submit" isDisabled={pending}>
        {pending ? 'Saving…' : 'Save learning preferences'}
      </Button>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
