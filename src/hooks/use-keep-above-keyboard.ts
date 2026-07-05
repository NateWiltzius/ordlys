'use client';

import { RefObject, useEffect } from 'react';

const VIEWPORT_CLEARANCE = 24;
const KEYBOARD_SETTLE_DELAY = 100;

export function useKeepAboveKeyboard(
  inputRef: RefObject<HTMLInputElement | null>,
  contextRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const context = contextRef.current;
    if (!viewport || !context) return;
    let settleTimer: number | undefined;

    const updatePosition = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const keyboardInset = Math.max(
          0,
          window.innerHeight - viewport.height - viewport.offsetTop,
        );
        context.dataset.keyboardOpen = String(keyboardInset > 0);
        context.style.marginBottom = keyboardInset > 0 ? `${keyboardInset + 16}px` : '';

        if (document.activeElement !== inputRef.current || keyboardInset === 0) return;

        requestAnimationFrame(() => {
          const input = inputRef.current;
          if (!input) return;

          const contextRect = context.getBoundingClientRect();
          const visibleTop = viewport.offsetTop + VIEWPORT_CLEARANCE;
          const visibleBottom = viewport.offsetTop + viewport.height - VIEWPORT_CLEARANCE;
          const availableHeight = visibleBottom - visibleTop;

          if (contextRect.height <= availableHeight) {
            if (contextRect.top < visibleTop || contextRect.bottom > visibleBottom) {
              window.scrollBy({
                top: contextRect.top - visibleTop,
                behavior: 'auto',
              });
            }
            return;
          }

          const updatedContextRect = context.getBoundingClientRect();
          if (updatedContextRect.bottom > visibleBottom) {
            window.scrollBy({
              top: updatedContextRect.bottom - visibleBottom,
              behavior: 'auto',
            });
          }
        });
      }, KEYBOARD_SETTLE_DELAY);
    };

    viewport.addEventListener('resize', updatePosition);

    return () => {
      window.clearTimeout(settleTimer);
      viewport.removeEventListener('resize', updatePosition);
      context.style.marginBottom = '';
      delete context.dataset.keyboardOpen;
    };
  }, [contextRef, inputRef]);
}
