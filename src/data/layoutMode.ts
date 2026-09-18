import { useState, useEffect } from 'react';

export type LayoutMode = 'friendly' | 'advanced';

const STORAGE_KEY = 'nanucloud_layout_mode';

export function getLayoutMode(): LayoutMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'friendly' || saved === 'advanced') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read layout mode:', e);
  }
  return 'friendly'; // Default to Friendly (Básico / Dinâmico) for best user experience
}

export function setLayoutMode(mode: LayoutMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent('nanucloud_layout_mode_changed', { detail: mode }));
  } catch (e) {
    console.error('Failed to set layout mode:', e);
  }
}

export function useLayoutMode(): [LayoutMode, (mode: LayoutMode) => void] {
  const [mode, setModeState] = useState<LayoutMode>(() => getLayoutMode());

  useEffect(() => {
    const handleModeChange = (e: any) => {
      const newMode = e.detail || getLayoutMode();
      setModeState(newMode);
    };

    window.addEventListener('nanucloud_layout_mode_changed', handleModeChange);
    return () => window.removeEventListener('nanucloud_layout_mode_changed', handleModeChange);
  }, []);

  const changeMode = (newMode: LayoutMode) => {
    setLayoutMode(newMode);
    setModeState(newMode);
  };

  return [mode, changeMode];
}
