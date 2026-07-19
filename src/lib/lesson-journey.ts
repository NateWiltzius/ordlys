export function getCenteredScrollLeft(
  itemOffset: number,
  itemWidth: number,
  viewportWidth: number,
) {
  return Math.max(0, itemOffset - (viewportWidth - itemWidth) / 2);
}

export function getLessonJourneyScrollState(
  scrollLeft: number,
  scrollWidth: number,
  viewportWidth: number,
) {
  const maximumScroll = Math.max(0, scrollWidth - viewportWidth);

  return {
    canScrollBack: scrollLeft > 2,
    canScrollForward: scrollLeft < maximumScroll - 2,
  };
}
