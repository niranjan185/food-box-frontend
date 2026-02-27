// Shared helpers for restaurant dashboard pages
// Keep minimal to prevent runtime errors when included by multiple pages.
(function(){
  // Example: centralized fetch wrapper (optional). Not used yet, but safe to include.
  window.rfetch = async function(url, opts = {}) {
    const resp = await fetch(url, opts);
    return resp;
  };
  // Simple noop for pages that may call initShared()
  window.initShared = window.initShared || function(){};
  console.log('[shared.js] loaded');
})();
