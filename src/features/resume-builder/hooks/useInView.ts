"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  /**
   * Root margin for the IntersectionObserver (e.g. "600px 0px" to treat
   * elements just outside the viewport as visible so content preloads).
   */
  rootMargin?: string;
  /** Report only the first intersection, then stop observing. */
  once?: boolean;
}

/**
 * Observes an element and reports whether it's inside (or, via `rootMargin`,
 * near) the viewport. Powers lazy-rendered template previews (Epic 10.1) and
 * the infinite-scroll sentinel on the templates page (Epic 10.2).
 *
 * The ref is a callback ref so observation is re-established whenever the
 * element mounts/unmounts (e.g. the grid is conditionally rendered while the
 * catalog loads, or the empty state swaps in).
 */
export function useInView<T extends Element = HTMLDivElement>({
  rootMargin = "0px",
  once = false,
}: UseInViewOptions = {}) {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
      // Fallback for environments without IntersectionObserver (e.g. SSR/tests)
      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setInView(true);
              if (once) observer.disconnect();
            } else if (!once) {
              setInView(false);
            }
          }
        },
        { rootMargin }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [rootMargin, once]
  );

  // Tear down the observer when the component unmounts
  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, inView };
}
