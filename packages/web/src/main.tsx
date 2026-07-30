import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@weather-demo/ui/tokens.css';
import './index.css';
import { App } from './App';
import { VisitorContextProvider } from './context/VisitorContextProvider';

const container = document.getElementById('root');
if (!container) {
  throw new Error('#root element not found');
}

// VisitorContextProvider sits outside BrowserRouter: it has no dependency on the router and this
// keeps it from re-rendering on every navigation.
createRoot(container).render(
  <StrictMode>
    <VisitorContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </VisitorContextProvider>
  </StrictMode>,
);
