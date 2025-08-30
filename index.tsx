import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppContextProvider } from './context/AppContext';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </React.StrictMode>
  );
}
