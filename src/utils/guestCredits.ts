import { useState, useEffect } from 'react';

export const DEFAULT_GUEST_FREE_CREDITS = 999999;

export function getGuestCredits(): number {
  return 999999;
}

export function useGuestCredit(): number {
  return 999999;
}

export const consumeGuestCredit = useGuestCredit;

export function hasGuestCredits(): boolean {
  return true;
}

export function resetGuestCredits(_count: number = 999999): void {
  // Free unrestricted mode
}

export function useGuestCredits(): number {
  const [credits, setCredits] = useState<number>(999999);

  useEffect(() => {
    setCredits(999999);
  }, []);

  return credits;
}
