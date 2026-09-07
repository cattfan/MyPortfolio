"use client";

import { useEffect, useRef } from "react";

export function useSectionReveal() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = container.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Map<Element, Animation>();
    const finish = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          element.dataset.reveal = "seen";
          if (query.matches || typeof element.animate !== "function") continue;
          const animation = element.animate(
            [
              { opacity: 0.35, translate: "0 12px" },
              { opacity: 1, translate: "0 0" },
            ],
            { duration: 560, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
          );
          animations.set(element, animation);
          animation.finished.then(
            () => animations.delete(element),
            () => animations.delete(element),
          );
        }
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => observer.observe(element));
    const update = () => {
      if (query.matches) finish();
    };
    // Focus and language changes take precedence over a decorative entrance.
    root.addEventListener("focusin", finish);
    window.addEventListener("portfolio-language", finish);
    query.addEventListener("change", update);
    return () => {
      observer.disconnect();
      finish();
      root.removeEventListener("focusin", finish);
      window.removeEventListener("portfolio-language", finish);
      query.removeEventListener("change", update);
    };
  }, []);
  return container;
}
