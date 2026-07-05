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
    const input = inputRef.current;
    if (!viewport || !context || !input) return;
    let settleTimer: number | undefined;

    const updatePosition = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const keyboardOpen = document.activeElement === input;
        const keyboardInset = Math.max(
          0,
          window.innerHeight - viewport.height - viewport.offsetTop,
        );
        context.dataset.keyboardOpen = String(keyboardOpen);
        context.style.marginBottom = keyboardInset > 0 ? `${keyboardInset + 16}px` : '';

        if (!keyboardOpen) return;

        requestAnimationFrame(() => {
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

    const clearKeyboardState = () => {
      window.clearTimeout(settleTimer);
      context.dataset.keyboardOpen = 'false';
      context.style.marginBottom = '';
    };

    viewport.addEventListener('resize', updatePosition);
    input.addEventListener('focus', updatePosition);
    input.addEventListener('blur', clearKeyboardState);
    updatePosition();

    return () => {
      window.clearTimeout(settleTimer);
      viewport.removeEventListener('resize', updatePosition);
      input.removeEventListener('focus', updatePosition);
      input.removeEventListener('blur', clearKeyboardState);
      context.style.marginBottom = '';
      delete context.dataset.keyboardOpen;
    };
  }, [contextRef, inputRef]);
}
