import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './eclipse-foundation.css';
import './deadpool-background.css';
import './deadpool-override.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('ECLIPSE root element is missing.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
