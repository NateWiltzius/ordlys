import { describe, expect, it } from 'vitest';
import { getStudyTextSizeClass } from '@/lib/study-text-size';

describe('getStudyTextSizeClass', () => {
  it('keeps short primary terms prominent', () => {
    expect(getStudyTextSizeClass('heart')).toContain('sm:text-5xl');
  });

  it('reduces long primary questions to readable paragraph sizing', () => {
    expect(getStudyTextSizeClass('a'.repeat(161))).toContain('sm:text-2xl');
  });

  it('uses a quieter scale for secondary content', () => {
    expect(getStudyTextSizeClass('heart', 'secondary')).toContain('sm:text-3xl');
    expect(getStudyTextSizeClass('a'.repeat(161), 'secondary')).toContain('sm:text-lg');
  });
});
