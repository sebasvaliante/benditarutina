import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ViajeApp from './ViajeApp.jsx';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-tiztrip.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ViajeApp />
  </StrictMode>,
);
