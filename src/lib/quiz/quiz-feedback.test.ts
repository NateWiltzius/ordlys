import { describe, expect, it } from 'vitest';
import { getWordCompletionContent } from './quiz-feedback';

describe('getWordCompletionContent', () => {
  it('uses the same Learning 1 outcome after a clean pass or an earlier miss', () => {
    expect(getWordCompletionContent('learn', 'clean')).toEqual(
      getWordCompletionContent('learn', 'recovered'),
    );
    expect(getWordCompletionContent('learn', 'recovered')).toEqual({
      title: 'Word complete',
      description: 'Both directions passed. This word will start at Learning 1.',
      isWarning: false,
    });
  });

  it('keeps an earlier miss visible when it affects a review', () => {
    expect(getWordCompletionContent('review', 'recovered')).toEqual({
      title: 'Word complete - keep practicing',
      description: 'You passed both directions, but missed this word earlier.',
      isWarning: true,
    });
  });

  it('explains whether the word qualified for placement', () => {
    expect(getWordCompletionContent('placement', 'clean').title).toBe('Placement passed');
    expect(getWordCompletionContent('placement', 'recovered')).toEqual({
      title: 'Placement not passed',
      description:
        'You completed both directions, but an earlier miss means this word will stay in the normal learning flow.',
      isWarning: true,
    });
  });
});
