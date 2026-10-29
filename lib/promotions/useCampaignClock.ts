'use client';

import { useEffect, useState } from 'react';

export function useCampaignClock(promoClock: string, freezeClock = false) {
  const [clock, setClock] = useState(() => new Date(promoClock));
  useEffect(() => {
    if (freezeClock) return;
    const timer = window.setInterval(() => setClock(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, [freezeClock]);
  return freezeClock ? new Date(promoClock) : clock;
}
