"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { usePathname } from "@/i18n/navigation";

function scrollToHashOrTop() {
  const rawHash = window.location.hash.slice(1);

  if (rawHash) {
    let id = rawHash;
    try {
      id = decodeURIComponent(rawHash);
    } catch {
      // Keep the original hash when it is not valid URI encoding.
    }

    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ block: "start" });
      return;
    }
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/**
 * Keeps page navigation predictable across reloads and App Router transitions.
 * Native hash navigation is preserved, while regular page entries always start
 * at the top instead of restoring an old document scroll position.
 */
export default function ScrollReset() {
  const pathname = usePathname();

  const resetScroll = useCallback(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(scrollToHashOrTop);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  useLayoutEffect(() => resetScroll(), [pathname, resetScroll]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const handlePageShow = () => {
      resetScroll();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [resetScroll]);

  return null;
}
