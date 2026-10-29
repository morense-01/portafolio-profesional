import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
}
if ('caches' in window) {
  caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);
