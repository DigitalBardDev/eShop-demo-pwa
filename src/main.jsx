import { Toaster } from 'react-hot-toast';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster position="bottom-right" toastOptions={{ style: { background: "#18181b", color: "#fff", border: "1px solid #3f3f46" } }} />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);