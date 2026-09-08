"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ScreenWakeLockStatus = "idle" | "requesting" | "active" | "blocked" | "unsupported";

type ScreenWakeLockSentinel = EventTarget & {
  readonly released: boolean;
  release: () => Promise<void>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<ScreenWakeLockSentinel>;
  };
};

export function useScreenWakeLock(enabled: boolean) {
  const sentinelRef = useRef<ScreenWakeLockSentinel | null>(null);
  const requestingRef = useRef(false);
  const enabledRef = useRef(enabled);
  const [status, setStatus] = useState<ScreenWakeLockStatus>("idle");

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const request = useCallback(async () => {
    if (!enabledRef.current || typeof navigator === "undefined") return;
    const wakeLock = (navigator as NavigatorWithWakeLock).wakeLock;
    if (!wakeLock) {
      setStatus("unsupported");
      return;
    }

    if (sentinelRef.current && !sentinelRef.current.released) {
      setStatus("active");
      return;
    }
    if (requestingRef.current) return;

    requestingRef.current = true;
    setStatus("requesting");
    try {
      const sentinel = await wakeLock.request("screen");
      if (!enabledRef.current) {
        await sentinel.release();
        return;
      }
      sentinelRef.current = sentinel;
      setStatus("active");
      sentinel.addEventListener("release", () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null;
        if (enabledRef.current) setStatus("blocked");
      }, { once: true });
    } catch {
      sentinelRef.current = null;
      if (enabledRef.current) setStatus("blocked");
    } finally {
      requestingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    queueMicrotask(() => void request());
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      if (sentinel && !sentinel.released) void sentinel.release();
    };
  }, [enabled, request]);

  return { status, request };
}
