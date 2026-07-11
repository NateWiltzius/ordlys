export function getVocabGridColumns(showSrsLevel: boolean, showActions: boolean) {
  if (showSrsLevel && showActions) {
    return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_10rem_12rem]';
  }
  if (showSrsLevel) {
    return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_10rem]';
  }
  if (showActions) {
    return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_12rem]';
  }
  return 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]';
}
