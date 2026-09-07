"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { localizedContent, type Language } from "../content/translations";

const LanguageContext = createContext({
  language: "vi" as Language,
  requestedLanguage: "vi" as Language,
  setLanguage: (_language: Language) => {},
});
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("portfolio-language", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("portfolio-language", callback);
  };
};
const getLanguage = (): Language => {
  try {
    return localStorage.getItem("portfolio-language") === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
};
const serverLanguage = (): Language => "vi";

function textElements() {
  const all = Array.from(
    document.querySelectorAll<HTMLElement>(
      "h2,h3,h4,p,a,button,summary,[data-language-text]",
    ),
  ).filter(
    (element) =>
      !element.closest("[data-language-static],noscript") &&
      Boolean(element.textContent?.trim()),
  );
  const visible = all.filter((element) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= 0 &&
      rect.top <= innerHeight
    );
  });
  return visible.filter(
    (element) =>
      !visible.some((parent) => parent !== element && parent.contains(element)),
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getLanguage, serverLanguage);
  const [override, setOverride] = useState<Language | null>(null);
  const [requested, setRequested] = useState<Language | null>(null);
  const animations = useRef<Animation[]>([]);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const language = override ?? stored;
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
      animations.current.forEach((animation) => animation.cancel());
      delete document.documentElement.dataset.languageTransition;
    },
    [],
  );
  function setLanguage(next: Language) {
    const id = ++sequence.current;
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = null;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    setRequested(next);
    const root = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const commit = () => {
      if (id !== sequence.current) return;
      // Only text fades: the map, images and scroll position keep their state.
      const position = window.scrollY;
      flushSync(() => setOverride(next));
      root.lang = next;
      window.scrollTo({ top: position, behavior: "instant" });
      try {
        localStorage.setItem("portfolio-language", next);
        window.dispatchEvent(new Event("portfolio-language"));
      } catch {
        /* Switching works without storage access. */
      }
      animations.current.forEach((animation) => animation.cancel());
      animations.current = [];
      if (reduced || typeof Element.prototype.animate !== "function") {
        root.dataset.languageTransition = "idle";
        return;
      }
      root.dataset.languageTransition = "enter";
      animations.current = textElements().map((element) =>
        element.animate(
          [
            { opacity: 0, filter: "blur(1px)" },
            { opacity: 1, filter: "blur(0px)" },
          ],
          { duration: 220, easing: "ease-out", fill: "both" },
        ),
      );
      Promise.allSettled(
        animations.current.map((animation) => animation.finished),
      ).then(() => {
        if (id !== sequence.current) return;
        animations.current.forEach((animation) => animation.cancel());
        animations.current = [];
        root.dataset.languageTransition = "idle";
      });
    };
    if (
      reduced ||
      typeof Element.prototype.animate !== "function" ||
      next === language
    ) {
      commit();
      return;
    }
    root.dataset.languageTransition = "exit";
    animations.current = textElements().map((element) =>
      element.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 120,
        easing: "ease-in",
        fill: "forwards",
      }),
    );
    swapTimer.current = setTimeout(commit, 120);
  }
  return (
    <LanguageContext.Provider
      value={{
        language,
        requestedLanguage: requested ?? language,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return {
    ...context,
    content: localizedContent[context.language],
    t: (vi: string, en: string) => (context.language === "vi" ? vi : en),
  };
}
