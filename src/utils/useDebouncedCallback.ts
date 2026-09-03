"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Wraps a callback so rapid calls collapse into one, `delay` ms after the last.
 * Used for controls a user drags — a range slider fires on every step, and
 * each step would otherwise become a network round-trip.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(fn);

  // Keep the ref current so a debounced call never fires a stale closure.
  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  // Drop any pending call when the component goes away.
  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  return useCallback((...args: Args) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => latest.current(...args), delay);
  }, [delay]);
}
