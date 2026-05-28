import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LocationProvider } from './contexts/LocationContext';
import { CartProvider } from './contexts/CartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocationProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </LocationProvider>
  </StrictMode>,
);
