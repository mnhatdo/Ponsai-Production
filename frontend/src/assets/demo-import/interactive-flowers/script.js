onload = () => {
  const startTimer = setTimeout(() => {
    document.body.classList.remove("not-loaded");
    clearTimeout(startTimer);
  }, 1000);

  const finishTimer = setTimeout(() => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'interactive-flowers-finished' }, '*');
    }
    clearTimeout(finishTimer);
  }, 6200);
};