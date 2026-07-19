'use client';

import { RefObject, useEffect } from 'react';

const VIEWPORT_CLEARANCE = 24;
const KEYBOARD_SETTLE_DELAY = 100;
const BLUR_CLEANUP_DELAY = 200;
const MINIMUM_SCROLL_BUFFER = 80;

export function useKeepAboveKeyboard(
  inputRef: RefObject<HTMLInputElement | null>,
  contextRef: RefObject<HTMLElement | null>,
  enabled = true,
  positionKey?: string | number,
) {
  useEffect(() => {
    if (!enabled) return;

    const viewport = window.visualViewport;
    const context = contextRef.current;
    const input = inputRef.current;
    if (!viewport || !context || !input) return;
    let settleTimer: number | undefined;
    let layoutViewportHeight = getStableLayoutViewportHeight(
      0,
      window.innerHeight,
      document.documentElement.clientHeight,
      viewport.height,
    );

    const updatePosition = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        layoutViewportHeight = getStableLayoutViewportHeight(
          layoutViewportHeight,
          window.innerHeight,
          document.documentElement.clientHeight,
          viewport.height,
        );
        // offsetTop describes viewport panning, not keyboard height. Subtracting it
        // makes the keyboard inset disappear after the first question scrolls. Keep
        // the pre-keyboard layout height as well because some mobile browsers resize
        // both window.innerHeight and visualViewport.height when the keyboard opens.
        const keyboardInset = getKeyboardInset(layoutViewportHeight, viewport.height);
        const keyboardOpen = document.activeElement === input && keyboardInset > 0;
        context.dataset.keyboardOpen = String(keyboardOpen);
        context.style.marginBottom = keyboardOpen
          ? `${Math.max(keyboardInset + 16, MINIMUM_SCROLL_BUFFER)}px`
          : '';

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
      settleTimer = window.setTimeout(() => {
        context.dataset.keyboardOpen = 'false';
        context.style.marginBottom = '';
      }, BLUR_CLEANUP_DELAY);
    };

    viewport.addEventListener('resize', updatePosition);
    viewport.addEventListener('scroll', updatePosition);
    input.addEventListener('focus', updatePosition);
    input.addEventListener('click', updatePosition);
    input.addEventListener('blur', clearKeyboardState);
    updatePosition();

    return () => {
      window.clearTimeout(settleTimer);
      viewport.removeEventListener('resize', updatePosition);
      viewport.removeEventListener('scroll', updatePosition);
      input.removeEventListener('focus', updatePosition);
      input.removeEventListener('click', updatePosition);
      input.removeEventListener('blur', clearKeyboardState);
      context.style.marginBottom = '';
      delete context.dataset.keyboardOpen;
    };
  }, [contextRef, enabled, inputRef, positionKey]);
}

export function getKeyboardInset(layoutViewportHeight: number, visualViewportHeight: number) {
  return Math.max(0, layoutViewportHeight - visualViewportHeight);
}

export function getStableLayoutViewportHeight(
  previousHeight: number,
  windowHeight: number,
  documentHeight: number,
  visualViewportHeight: number,
) {
  return Math.max(previousHeight, windowHeight, documentHeight, visualViewportHeight);
}
