
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Menggunakan path relatif './sw.js' bukan absolut '/sw.js'
    // Ini membantu saat aplikasi di-hosting di sub-path atau lingkungan preview tertentu
    try {
        navigator.serviceWorker.register('./sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            // Silently catch registration errors in preview environments where origins might differ
            console.warn('Service Worker registration failed (likely due to environment constraints):', error);
          });
    } catch (e) {
        console.warn('Service Worker registration skipped:', e);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  React.createElement(App, null)
);
