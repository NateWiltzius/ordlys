import { OrderDirection } from '@/types/order.types';

export function moveItem<T>(items: T[], currentIndex: number, direction: OrderDirection): T[] {
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const reorderedItems = [...items];
  [reorderedItems[currentIndex], reorderedItems[targetIndex]] = [
    reorderedItems[targetIndex],
    reorderedItems[currentIndex],
  ];

  return reorderedItems;
}

export function moveItemToIndex<T>(items: T[], currentIndex: number, targetIndex: number): T[] {
  if (
    currentIndex < 0 ||
    currentIndex >= items.length ||
    targetIndex < 0 ||
    targetIndex >= items.length ||
    currentIndex === targetIndex
  ) {
    return items;
  }

  const reorderedItems = [...items];
  const [item] = reorderedItems.splice(currentIndex, 1);
  reorderedItems.splice(targetIndex, 0, item);
  return reorderedItems;
}
