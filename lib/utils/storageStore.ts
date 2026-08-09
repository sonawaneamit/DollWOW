"use client";

import { useSyncExternalStore } from "react";

/**
 * Creates a useSyncExternalStore-compatible binding for a localStorage key.
 * Snapshots are cached by raw value so referential stability holds between
 * actual changes (required by useSyncExternalStore).
 */
export function createStorageStore<T>(key: string, changeEvent: string, parse: (raw: string | null) => T, fallback: T) {
  let cachedRaw: string | null | undefined;
  let cachedValue: T | undefined;

  function getSnapshot(): T {
    const raw = window.localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = parse(raw);
    }
    return cachedValue as T;
  }

  function getServerSnapshot(): T {
    return fallback;
  }

  function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(changeEvent, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(changeEvent, onChange);
    };
  }

  return { getSnapshot, getServerSnapshot, subscribe };
}

/** True on the client after hydration; false during SSR and hydration. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
