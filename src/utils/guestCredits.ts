import { useState, useEffect } from 'react';

export const DEFAULT_GUEST_FREE_CREDITS = 0;

export function getGuestCredits(): number {
  return 0;
}

export function useGuestCredit(): number {
  return 0;
}

export const consumeGuestCredit = useGuestCredit;

export function hasGuestCredits(): boolean {
  return false;
}

export function resetGuestCredits(_count: number = 0): void {
  // No free consultations without registration
}

export function useGuestCredits(): number {
  return 0;
}
