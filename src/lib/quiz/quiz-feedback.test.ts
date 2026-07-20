import { describe, expect, it } from 'vitest';
import { getDirectionProgressContent, getWordCompletionContent } from './quiz-feedback';

describe('getWordCompletionContent', () => {
  it('uses the same Learning 1 outcome after a clean pass or an earlier miss', () => {
    expect(getWordCompletionContent('learn', 'clean')).toEqual(
      getWordCompletionContent('learn', 'recovered'),
    );
    expect(getWordCompletionContent('learn', 'recovered')).toEqual({
      title: 'Word complete',
      description:
        'Both directions passed. This word will start at Learning 1 and return in 4 hours.',
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

  it('explains the memory transition and next interval after a review', () => {
    expect(getWordCompletionContent('review', 'clean', 2)).toEqual({
      title: 'Word complete',
      description: 'Learning 3 → Strong 4. Next review in 2 days.',
      isWarning: false,
    });

    expect(getWordCompletionContent('review', 'recovered', 3)).toEqual({
      title: 'Word complete — keep practising',
      description: 'Strong 4 → Learning 3 after an earlier miss. Next review in 1 day.',
      isWarning: true,
    });
  });

  it('makes it clear that optional practice does not change scheduling', () => {
    expect(getWordCompletionContent('review', 'clean', 4, false)).toEqual({
      title: 'Practice complete',
      description:
        'You passed both directions. Optional practice does not change the review schedule.',
      isWarning: false,
    });
  });
});

describe('getDirectionProgressContent', () => {
  it('explains when the schedule will be updated', () => {
    expect(getDirectionProgressContent(true)).toEqual({
      title: 'One direction passed',
      description: 'Pass the other direction to complete this word and update its review schedule.',
      isWarning: false,
    });
    expect(getDirectionProgressContent(false).description).toContain('return later in the session');
  });

  it('does not imply that optional practice changes scheduling', () => {
    expect(getDirectionProgressContent(false, false)).toEqual({
      title: 'Try this direction again',
      description:
        'This direction will return later in this practice session. Your review schedule will not change.',
      isWarning: true,
    });
  });
});
