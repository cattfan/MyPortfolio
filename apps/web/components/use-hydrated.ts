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
    const frame = requestAnimationFrame(() => {
      setEligible(
        window.location.hash === "" &&
          window.scrollY < 2 &&
          document.activeElement === document.body,
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return eligible;
}
