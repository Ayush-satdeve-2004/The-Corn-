import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

// Automatically unregister any old service workers from previous projects on localhost
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UploadProvider>
          <App />
        </UploadProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
