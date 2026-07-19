import { describe, expect, it } from 'vitest';
import { moveItem, moveItemToIndex } from './move-item';

describe('moveItem', () => {
  it('moves an item one place in the requested direction', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'up')).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 'down')).toEqual(['a', 'c', 'b']);
  });
});

describe('moveItemToIndex', () => {
  it('moves an item directly to a later position', () => {
    expect(moveItemToIndex(['a', 'b', 'c', 'd'], 0, 3)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('moves an item directly to an earlier position', () => {
    expect(moveItemToIndex(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('keeps the original array when the move is invalid or unnecessary', () => {
    const items = ['a', 'b', 'c'];

    expect(moveItemToIndex(items, 1, 1)).toBe(items);
    expect(moveItemToIndex(items, -1, 1)).toBe(items);
    expect(moveItemToIndex(items, 1, 3)).toBe(items);
  });
});
