"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}

/** A cached, mount-time browser value with an explicit hydration fallback. */
export function useInitialClientValue<T>(read: () => T, serverValue: T): T {
  const [getSnapshot] = useState(() => {
    let initialized = false;
    let value = serverValue;
    return () => {
      if (!initialized) {
        value = read();
        initialized = true;
      }
      return value;
    };
  });
  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}

// This mutable store owns a browser resource, independently of React render.
function createObjectUrlStore(file: File) {
  let url = "";
  return {
    getSnapshot: () => url,
    subscribe: (notify: () => void) => {
      url = URL.createObjectURL(file);
      notify();
      return () => {
        URL.revokeObjectURL(url);
        url = "";
      };
    },
  };
}

/** Create and dispose a browser resource on subscription, after commit. */
export function useObjectUrl(file: File): string {
  const store = useMemo(() => createObjectUrlStore(file), [file]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => "");
}
