// This script runs BEFORE React loads to suppress AbortError
(function() {
  'use strict';

  // Override console.error to filter AbortError
  const originalError = console.error;
  console.error = function() {
    const args = Array.from(arguments);
    const errorString = args.join(' ');

    // Block AbortError from being logged
    if (errorString.includes('AbortError') ||
        errorString.includes('signal is aborted')) {
      return;
    }

    originalError.apply(console, arguments);
  };

  // Capture ALL errors in capture phase
  window.addEventListener('error', function(event) {
    if (event.error?.name === 'AbortError' ||
        event.message?.includes('signal is aborted')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Capture ALL promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('signal is aborted')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  console.log('✅ AbortError suppression loaded');
})();
