chrome.storage.local.get(['redirectNewTab'], (result) => {
  
  const isEnabled = result.redirectNewTab !== false;


  if (isEnabled) {
    window.location.href = "https://www.google.com/";
  }
});