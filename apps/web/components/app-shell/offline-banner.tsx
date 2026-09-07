"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * §37 PWA Strategy "Network status detection". Purely informational — it
 * never changes what the app lets the user do; mutating actions still hit
 * the API and fail normally (with their existing error handling) if the
 * network is actually down. See public/sw.js for why nothing is queued.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-300">
      <WifiOff className="size-3.5" />
      You&apos;re offline — changes will not be saved until the connection returns.
    </div>
  );
}
