"use client";

import { useEffect } from "react";
import { useKeyStore } from "./keystore";
import { useSyncStore } from "./sync";

/**
 * Mounts online sync: pulls the encrypted vault on startup when signed in and
 * pushes (debounced) whenever the local keystore changes.
 */
export const SyncProvider = () => {
  useEffect(() => {
    let cancelled = false;

    // Wait for both persisted stores to rehydrate before first sync.
    const start = async () => {
      await useKeyStore.persist.rehydrate();
      await useSyncStore.persist.rehydrate();
      if (cancelled) return;
      if (useSyncStore.getState().token) {
        useSyncStore.getState().syncNow();
      }
    };
    start();

    const unsubscribe = useKeyStore.subscribe(() => {
      useSyncStore.getState().schedulePush();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return null;
};
