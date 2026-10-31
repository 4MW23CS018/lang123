import ReactDOM from 'react-dom/client';
import { ConvexProvider } from 'convex/react';
import convex from './lib/convex';
import App from './App';
import './index.css';

// Automatically reload the page when a new deployment invalidates old chunk hashes
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = Number(sessionStorage.getItem('last_preload_reload') || 0);
  const now = Date.now();
  if (now - lastReload > 5000) {
    sessionStorage.setItem('last_preload_reload', String(now));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
