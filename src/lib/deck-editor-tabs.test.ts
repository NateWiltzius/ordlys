import { describe, expect, it } from 'vitest';
import { parseDeckEditorTab } from './deck-editor-tabs';

describe('parseDeckEditorTab', () => {
  it('opens publishing from its direct URL', () => {
    expect(parseDeckEditorTab('publishing')).toBe('publishing');
  });

  it('uses content by default', () => {
    expect(parseDeckEditorTab(undefined)).toBe('content');
  });

  it('falls back to content for unsupported or repeated values', () => {
    expect(parseDeckEditorTab('settings')).toBe('content');
    expect(parseDeckEditorTab(['publishing', 'content'])).toBe('content');
  });
});
