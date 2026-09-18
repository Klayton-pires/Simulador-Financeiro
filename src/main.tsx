import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initBrowserCompatibility } from './utils/browserCompatibility';
import { I18nProvider } from './i18n/I18nContext';

// Ensure full compatibility across all modern and legacy browsers
initBrowserCompatibility();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);

