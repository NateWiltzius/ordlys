import { describe, expect, it } from 'vitest';
import { getCenteredScrollLeft, getLessonJourneyScrollState } from './lesson-journey';

describe('lesson journey scrolling', () => {
  it('centers a lesson that starts beyond the initial viewport', () => {
    expect(getCenteredScrollLeft(420, 32, 280)).toBe(296);
  });

  it('does not scroll before the beginning of the journey', () => {
    expect(getCenteredScrollLeft(12, 32, 280)).toBe(0);
  });

  it('disables both controls when the journey fits', () => {
    expect(getLessonJourneyScrollState(0, 260, 280)).toEqual({
      canScrollBack: false,
      canScrollForward: false,
    });
  });

  it('reports the available direction after scrolling forward', () => {
    expect(getLessonJourneyScrollState(120, 720, 280)).toEqual({
      canScrollBack: true,
      canScrollForward: true,
    });
    expect(getLessonJourneyScrollState(440, 720, 280)).toEqual({
      canScrollBack: true,
      canScrollForward: false,
    });
  });
});
