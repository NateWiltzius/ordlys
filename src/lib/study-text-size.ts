type StudyTextProminence = 'primary' | 'secondary';

export function getStudyTextSizeClass(value: string, prominence: StudyTextProminence = 'primary') {
  const length = value.trim().length;

  if (prominence === 'secondary') {
    if (length > 160) return 'text-base leading-relaxed font-normal sm:text-lg';
    if (length > 90) return 'text-lg leading-relaxed font-normal sm:text-xl';
    if (length > 45) return 'text-xl leading-snug font-medium sm:text-2xl';
    return 'text-2xl leading-snug font-medium sm:text-3xl';
  }

  if (length > 160) return 'text-xl leading-relaxed font-medium sm:text-2xl';
  if (length > 90) return 'text-2xl leading-snug font-medium sm:text-3xl';
  if (length > 45) return 'text-3xl leading-tight font-semibold sm:text-4xl';
  return 'text-4xl leading-tight font-semibold sm:text-5xl';
}
