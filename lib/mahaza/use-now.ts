"use client";

import { useEffect, useState } from "react";

/** Horloge en millisecondes, rafraîchie à intervalle régulier (0 tant que le composant n'est pas monté). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
