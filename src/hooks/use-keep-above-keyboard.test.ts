import { describe, expect, it } from 'vitest';
import { getKeyboardInset, getStableLayoutViewportHeight } from './use-keep-above-keyboard';

describe('getKeyboardInset', () => {
  it('keeps the keyboard inset when the visual viewport is shorter than the layout viewport', () => {
    expect(getKeyboardInset(844, 500)).toBe(344);
  });

  it('does not return a negative inset when the visual viewport is at least as tall', () => {
    expect(getKeyboardInset(844, 900)).toBe(0);
  });

  it('keeps the pre-keyboard height when both mobile viewports shrink', () => {
    expect(getStableLayoutViewportHeight(844, 500, 500, 500)).toBe(844);
  });
});
