"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}

export function useInitialEnhancementEligibility() {
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    let removeScroll = () => {};
    const frame = requestAnimationFrame(() => {
      if (
        window.location.hash === "" &&
        window.scrollY < 2 &&
        document.activeElement === document.body
      ) {
        setEligible(true);
        return;
      }
      // The visitor arrived mid-page (a hash link, a restored scroll position or
      // an early scroll). Upgrade once they are back at the very top, where no
      // reading position or open disclosure can be disturbed.
      const upgradeAtTop = () => {
        if (window.scrollY >= 2 || document.querySelector("details[open]"))
          return;
        setEligible(true);
        removeScroll();
      };
      window.addEventListener("scroll", upgradeAtTop, { passive: true });
      removeScroll = () => window.removeEventListener("scroll", upgradeAtTop);
    });
    return () => {
      cancelAnimationFrame(frame);
      removeScroll();
    };
  }, []);
  return eligible;
}
