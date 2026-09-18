// browserCompatibility.ts - Suporte e Polyfills para Navegadores no Windows e Outros SOs
/**
 * Garante que a aplicação NANUCLOUD funcione perfeitamente em:
 * - Microsoft Edge (Chromium & Legacy) no Windows 10/11
 * - Google Chrome no Windows 10/11 / Mac / Linux
 * - Mozilla Firefox no Windows
 * - Brave, Opera, Vivaldi
 * - Safari 10+ (iOS e macOS)
 * - Navegadores móveis (Android WebViews, Chrome Android, Samsung Internet)
 */

export interface SystemEnvironmentInfo {
  isWindows: boolean;
  isEdge: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isMobile: boolean;
  isPWA: boolean;
  supportsTouch: boolean;
  devicePixelRatio: number;
  browserName: string;
  osName: string;
}

let cachedEnvInfo: SystemEnvironmentInfo | null = null;
let deferredPrompt: any = null;

export function getSystemEnvironmentInfo(): SystemEnvironmentInfo {
  if (cachedEnvInfo) return cachedEnvInfo;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';

  const isWindows = /Windows|Win32|Win64|WOW64/i.test(ua) || /Win/i.test(platform);
  const isEdge = /Edg\//i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !isEdge;
  const isFirefox = /Firefox\//i.test(ua);
  const isSafari = /Safari\//i.test(ua) && !isChrome && !isEdge;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  const supportsTouch = typeof window !== 'undefined' && (
    'ontouchstart' in window || navigator.maxTouchPoints > 0
  );
  const devicePixelRatio = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  let browserName = 'Navegador Moderno';
  if (isEdge) browserName = 'Microsoft Edge (Windows)';
  else if (isChrome) browserName = 'Google Chrome';
  else if (isFirefox) browserName = 'Mozilla Firefox';
  else if (isSafari) browserName = 'Apple Safari';

  let osName = 'Outro SO';
  if (isWindows) osName = 'Microsoft Windows (10/11)';
  else if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) osName = 'Apple macOS';
  else if (/Android/i.test(ua)) osName = 'Google Android';
  else if (/iPhone|iPad/i.test(ua)) osName = 'Apple iOS';
  else if (/Linux/i.test(platform)) osName = 'GNU/Linux';

  cachedEnvInfo = {
    isWindows,
    isEdge,
    isChrome,
    isFirefox,
    isSafari,
    isMobile,
    isPWA,
    supportsTouch,
    devicePixelRatio,
    browserName,
    osName
  };

  return cachedEnvInfo;
}

export function initBrowserCompatibility(): void {
  try {
    // 1. Polyfill para globalThis
    if (typeof (window as any).globalThis === 'undefined') {
      (window as any).globalThis = window;
    }

    // 2. Polyfill para structuredClone (Browsers antigos)
    if (typeof (window as any).structuredClone === 'undefined') {
      (window as any).structuredClone = (obj: any) => {
        if (obj === undefined) return undefined;
        return JSON.parse(JSON.stringify(obj));
      };
    }

    // 3. Polyfill para Promise.allSettled
    if (!Promise.allSettled) {
      (Promise as any).allSettled = function (promises: Iterable<Promise<any>>) {
        return Promise.all(
          Array.from(promises).map((p) =>
            Promise.resolve(p).then(
              (value) => ({ status: 'fulfilled', value }),
              (reason) => ({ status: 'rejected', reason })
            )
          )
        );
      };
    }

    // 4. Polyfill para Array.prototype.flat
    if (!Array.prototype.flat) {
      (Array.prototype as any).flat = function (depth = 1) {
        return (depth > 0
          ? this.reduce(
              (acc: any[], val: any) =>
                acc.concat(Array.isArray(val) ? (val as any).flat(depth - 1) : val),
              []
            )
          : this.slice());
      };
    }

    // 5. Polyfill para Object.fromEntries
    if (!Object.fromEntries) {
      Object.fromEntries = function (entries: any) {
        if (!entries || !entries[Symbol.iterator]) {
          throw new TypeError('Object.fromEntries() requires a single iterable argument');
        }
        const obj: Record<string, any> = {};
        for (const [key, val] of entries) {
          obj[key] = val;
        }
        return obj;
      };
    }

    // 6. Polyfill Seguro para LocalStorage (caso cookies/storage estejam bloqueados ou em navegadores antigos)
    try {
      const testKey = '__nanucloud_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
    } catch (e) {
      console.warn('LocalStorage inacessível ou restrito. Ativando MemoryStorage Fallback...');
      const memoryStorage: Record<string, string> = {};
      const storageFallback = {
        getItem: (key: string) => memoryStorage[key] || null,
        setItem: (key: string, value: string) => {
          memoryStorage[key] = String(value);
        },
        removeItem: (key: string) => {
          delete memoryStorage[key];
        },
        clear: () => {
          Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
        },
        key: (idx: number) => Object.keys(memoryStorage)[idx] || null,
        get length() {
          return Object.keys(memoryStorage).length;
        }
      };
      Object.defineProperty(window, 'localStorage', {
        value: storageFallback,
        writable: true
      });
    }

    // 7. Clipboard Fallback seguro
    if (!navigator.clipboard) {
      (navigator as any).clipboard = {
        writeText: (text: string) => {
          return new Promise<void>((resolve, reject) => {
            try {
              const textArea = document.createElement('textarea');
              textArea.value = text;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              textArea.style.top = '-999999px';
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              const successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              if (successful) resolve();
              else reject(new Error('Falha ao copiar'));
            } catch (err) {
              reject(err);
            }
          });
        }
      };
    }

    // 8. Otimização para Navegadores no Windows (ClearType e Font Smoothing)
    const env = getSystemEnvironmentInfo();
    if (typeof document !== 'undefined') {
      if (env.isWindows) {
        document.documentElement.classList.add('os-windows');
      }
      if (env.isEdge) {
        document.documentElement.classList.add('browser-edge');
      }
    }

    // 9. Capturar evento de instalação PWA para Windows / Edge
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('💡 App instalável no Windows / Edge / Chrome.');
      });
    }

    // 11. Intercetor Global de Fetch para Autenticação JWT e Cookie Session
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      const originalFetch = window.fetch;
      window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let urlStr = '';
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.toString();
        } else if (input && typeof (input as any).url === 'string') {
          urlStr = (input as any).url;
        }

        // Intercetar apenas chamadas para endpoints /api da aplicação
        if (urlStr.startsWith('/api') || urlStr.includes('/api/')) {
          const token = localStorage.getItem('nanucloud_token');
          const modifiedInit: RequestInit = { ...init };
          
          let headers: Headers;
          if (modifiedInit.headers instanceof Headers) {
            headers = modifiedInit.headers;
          } else if (Array.isArray(modifiedInit.headers)) {
            headers = new Headers(modifiedInit.headers);
          } else if (modifiedInit.headers && typeof modifiedInit.headers === 'object') {
            headers = new Headers(modifiedInit.headers as Record<string, string>);
          } else {
            headers = new Headers();
          }

          if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }

          if (!modifiedInit.credentials) {
            modifiedInit.credentials = 'include';
          }

          modifiedInit.headers = headers;
          return originalFetch(input, modifiedInit);
        }

        return originalFetch(input, init);
      };
    }
  } catch (err) {
    console.warn('Compatibilidade inicializada com avisos:', err);
  }
}

/**
 * Solicitar instalação PWA no Windows
 */
export async function promptWindowsPwaInstall(): Promise<boolean> {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
}
