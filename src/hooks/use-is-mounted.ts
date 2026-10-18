"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * React 19 idiomatic mounted hook.
 * Avoids calling setState synchronously inside useEffect which causes cascading renders.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
