import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const onConflictDoNothing = vi.fn();
  const onConflictDoUpdate = vi.fn();
  const values = vi.fn(() => ({ onConflictDoNothing, onConflictDoUpdate }));
  return {
    user: vi.fn(),
    release: vi.fn(),
    progress: vi.fn(),
    insert: vi.fn(() => ({ values })),
    values,
    onConflictDoNothing,
    onConflictDoUpdate,
    revalidate: vi.fn(),
  };
});
vi.mock('@/db', () => ({ db: { insert: mocks.insert } }));
vi.mock('@/lib/auth/get-current-user-id', () => ({ getCurrentUserId: mocks.user }));
vi.mock('@/db/queries/deck-access', () => ({ getActiveReleaseId: mocks.release }));
vi.mock('@/db/queries/review.queries', () => ({ getLessonProgressForDeck: mocks.progress }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

import { continueToLessonAction, saveStudyPreferencesAction } from './study-preferences.actions';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue('current-user');
  mocks.release.mockResolvedValue(1);
  mocks.progress.mockResolvedValue([{ lessonId: 2, isUnlocked: false, canContinueEarly: true }]);
});

describe('early lesson continuation', () => {
  it('persists the authenticated user’s explicit choice and refreshes dependent pages', async () => {
    await continueToLessonAction(1, 2);
    expect(mocks.values).toHaveBeenCalledWith({ userId: 'current-user', lessonId: 2 });
    expect(mocks.onConflictDoNothing).toHaveBeenCalled();
    expect(mocks.revalidate).toHaveBeenCalledWith('/', 'layout');
  });
  it('rejects inaccessible decks before reading progress', async () => {
    mocks.release.mockResolvedValue(null);
    await expect(continueToLessonAction(1, 2)).rejects.toThrow('Deck unavailable');
    expect(mocks.progress).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('rejects a forged request for a lesson outside the deck', async () => {
    await expect(continueToLessonAction(1, 99)).rejects.toThrow('Lesson unavailable');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('enforces strict progression on the server', async () => {
    mocks.progress.mockResolvedValue([{ lessonId: 2, isUnlocked: false, canContinueEarly: false }]);
    await expect(continueToLessonAction(1, 2)).rejects.toThrow('Strengthen');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('allows safe retries after the lesson is already opened', async () => {
    mocks.progress.mockResolvedValue([{ lessonId: 2, isUnlocked: true, canContinueEarly: false }]);
    await continueToLessonAction(1, 2);
    expect(mocks.onConflictDoNothing).toHaveBeenCalled();
  });
});

describe('saving preferences', () => {
  it('validates before writing and uses the authenticated user', async () => {
    await expect(
      saveStudyPreferencesAction({
        strictProgression: true,
        dailyNewWordTarget: 0,
        timeZone: 'UTC',
      }),
    ).rejects.toThrow();
    expect(mocks.insert).not.toHaveBeenCalled();
    await saveStudyPreferencesAction({
      strictProgression: true,
      dailyNewWordTarget: 15,
      timeZone: 'Europe/Berlin',
    });
    expect(mocks.values).toHaveBeenCalledWith({
      userId: 'current-user',
      strictProgression: true,
      dailyNewWordTarget: 15,
      timeZone: 'Europe/Berlin',
    });
    expect(mocks.onConflictDoUpdate).toHaveBeenCalled();
  });
});
