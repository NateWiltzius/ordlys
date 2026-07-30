export function getVocabGridColumns(showSrsLevel: boolean, showActions: boolean) {
  if (showSrsLevel && showActions) {
    return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_10rem_7rem]';
  }
  if (showSrsLevel) {
    return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_10rem]';
  }
  if (showActions) {
    return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_7rem]';
  }
  return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]';
}
