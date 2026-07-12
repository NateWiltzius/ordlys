import { describe, expect, it } from 'vitest';
import { buildDeckCsv, downloadFilename } from './csv';

describe('deck CSV export', () => {
  it('preserves importable fields and escapes commas and quotes', () => {
    const csv = buildDeckCsv([
      {
        front: 'å si',
        back: 'to say, "tell"',
        lesson: 'Core verbs',
        reading: null,
        frontAlternatives: ['si'],
        backAlternatives: ['say', 'tell'],
        frontToBackQuizHint: null,
        backToFrontQuizHint: 'Use the infinitive marker.',
        tags: ['verb', 'A1'],
        metadata: { partOfSpeech: 'verb' },
        notes: 'Common verb',
      },
    ]);

    expect(csv).toContain('\uFEFFfront,back,lesson');
    expect(csv).toContain('å si,"to say, ""tell""",Core verbs');
    expect(csv).toContain('si,say|tell,,Use the infinitive marker.,verb|A1');
    expect(csv).toContain('"{""partOfSpeech"":""verb""}"');
  });

  it('creates a safe filename', () => {
    expect(downloadFilename('Norwegian Bokmål: A1 / Core', 'csv')).toBe(
      'norwegian-bokmal-a1-core.csv',
    );
  });
});
