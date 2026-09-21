import { useState, useEffect } from 'react';

export const DEFAULT_GUEST_FREE_CREDITS = 50;

export function getGuestCredits(): number {
  try {
    const saved = localStorage.getItem('nanucloud_guest_credits');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? DEFAULT_GUEST_FREE_CREDITS : parsed;
    }
    localStorage.setItem('nanucloud_guest_credits', String(DEFAULT_GUEST_FREE_CREDITS));
    return DEFAULT_GUEST_FREE_CREDITS;
  } catch {
    return DEFAULT_GUEST_FREE_CREDITS;
  }
}

export function consumeGuestCredit(amount: number = 1): number {
  try {
    const current = getGuestCredits();
    const next = Math.max(0, current - amount);
    localStorage.setItem('nanucloud_guest_credits', String(next));
    window.dispatchEvent(new CustomEvent('nanucloud_guest_credits_updated', { detail: next }));
    return next;
  } catch {
    return DEFAULT_GUEST_FREE_CREDITS;
  }
}

export function hasGuestCredits(): boolean {
  return getGuestCredits() > 0;
}

export function resetGuestCredits(count: number = DEFAULT_GUEST_FREE_CREDITS): void {
  try {
    localStorage.setItem('nanucloud_guest_credits', String(count));
    window.dispatchEvent(new CustomEvent('nanucloud_guest_credits_updated', { detail: count }));
  } catch {
    // ignore
  }
}

export function useGuestCredits(): number {
  const [credits, setCredits] = useState<number>(getGuestCredits);

  useEffect(() => {
    const handler = (e: any) => {
      if (typeof e?.detail === 'number') {
        setCredits(e.detail);
      } else {
        setCredits(getGuestCredits());
      }
    };
    window.addEventListener('nanucloud_guest_credits_updated', handler);
    return () => window.removeEventListener('nanucloud_guest_credits_updated', handler);
  }, []);

  return credits;
}

export const useGuestCredit = consumeGuestCredit;
