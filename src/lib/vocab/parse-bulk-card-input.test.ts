import { describe, expect, it } from 'vitest';
import { MAX_BULK_CARDS, parseBulkCardInput } from './parse-bulk-card-input';

describe('parseBulkCardInput', () => {
  it('parses spreadsheet rows with an optional reading column', () => {
    const result = parseBulkCardInput(
      'bonjour\thello\nmerci\tthank you\tmehr-see\n\nau revoir\tgoodbye',
    );

    expect(result.cards).toEqual([
      { front: 'bonjour', back: 'hello', reading: null },
      { front: 'merci', back: 'thank you', reading: 'mehr-see' },
      { front: 'au revoir', back: 'goodbye', reading: null },
    ]);
    expect(result.errorCount).toBe(0);
  });

  it('recognizes and skips a front/back/reading header', () => {
    const result = parseBulkCardInput('Front\tBack\tReading\nhei\thello\thigh');

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].lineNumber).toBe(2);
    expect(result.cards[0]).toEqual({ front: 'hei', back: 'hello', reading: 'high' });
  });

  it('reports malformed and oversized rows with their source line', () => {
    const result = parseBulkCardInput(
      `front only\n\tmissing front\nvalid\tback\treading\textra\n${'x'.repeat(256)}\tback`,
    );

    expect(result.cards).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      lineNumber: 1,
      errors: ['Separate the front and back with a tab.', 'Back is required.'],
    });
    expect(result.rows[1].errors).toContain('Front is required.');
    expect(result.rows[2].errors).toContain('Use at most three columns: front, back, and reading.');
    expect(result.rows[3].errors).toContain('Front must be 255 characters or fewer.');
  });

  it('warns about duplicates without blocking an otherwise valid batch', () => {
    const result = parseBulkCardInput('hei\thello\nHEI\thello\nha det\tgoodbye', [
      { front: 'Ha det', back: 'goodbye' },
    ]);

    expect(result.cards).toHaveLength(3);
    expect(result.warningCount).toBe(2);
    expect(result.rows[1].warnings).toEqual(['Duplicate within this batch.']);
    expect(result.rows[2].warnings).toEqual(['Already exists in this lesson.']);
  });

  it('rejects batches over the configured limit', () => {
    const input = Array.from({ length: MAX_BULK_CARDS + 1 }, (_, index) => {
      return `front ${index}\tback ${index}`;
    }).join('\n');

    const result = parseBulkCardInput(input);

    expect(result.cards).toEqual([]);
    expect(result.batchError).toContain(`${MAX_BULK_CARDS + 1}`);
  });
});
