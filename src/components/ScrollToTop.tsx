import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component ensures that every route change resets the scroll position
 * to the top of the page. This fixes the issue where pages open at the previous
 * scroll position or in the middle of the content.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto" // Using "auto" for instant jump as requested
    });

    // Reset common scroll containers if they exist
    // This is a safety measure in case the layout uses absolute positioned scrollable divs
    const scrollableContainers = document.querySelectorAll('.overflow-auto, .overflow-y-auto, main');
    scrollableContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [pathname]);

  return null;
}
