import './index.css';
import './components/notifications/notifications.css';

import App from './App';
import AppProvider from './providers/AppProvider';
import React from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);