import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Completely suppress AbortError from React error overlay and console
// This must run BEFORE React loads
const originalConsoleError = console.error;
console.error = function(...args) {
  const firstArg = args[0];
  // Suppress specific React error overlay messages for AbortError
  if (typeof firstArg === 'string' && (
    firstArg.includes('AbortError') ||
    firstArg.includes('signal is aborted')
  )) {
    return; // Don't log these errors
  }
  originalConsoleError.apply(console, args);
};

// Capture errors at the window level before React can process them
window.addEventListener('error', (event) => {
  if (event.error?.name === 'AbortError' || event.message?.includes('signal is aborted')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
}, true); // Use capture phase

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('signal is aborted')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true); // Use capture phase

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
