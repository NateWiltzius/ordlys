export type DeckEditorTab = 'content' | 'publishing';

export function parseDeckEditorTab(value: string | string[] | undefined): DeckEditorTab {
  return value === 'publishing' ? 'publishing' : 'content';
}
