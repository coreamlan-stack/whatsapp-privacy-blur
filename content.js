(() => {
  'use strict';

  const DEFAULTS = { enabled: true, chatList: true, messages: true, profilePhotos: true, media: true, revealOnHover: true };
  const root = document.documentElement;
  const seen = new WeakSet();
  let scheduled = false;

  // A blank frame is safer than leaking text while the async storage lookup completes.
  root.dataset.wpbPending = 'true';

  function applySettings(settings) {
    const value = { ...DEFAULTS, ...settings };
    root.dataset.wpbEnabled = String(value.enabled);
    root.dataset.wpbChatList = String(value.chatList);
    root.dataset.wpbMessages = String(value.messages);
    root.dataset.wpbProfilePhotos = String(value.profilePhotos);
    root.dataset.wpbMedia = String(value.media);
    root.dataset.wpbHover = String(value.revealOnHover);
    delete root.dataset.wpbPending;
  }

  function mark(element, type) {
    if (!(element instanceof Element) || seen.has(element)) return;
    seen.add(element);
    element.dataset.wpbTarget = type;
  }

  function isInSidePane(element) {
    return Boolean(element.closest('#pane-side, [data-testid="chat-list"], [aria-label*="Chat list"]'));
  }

  function process(scope = document) {
    // Chat rows: WhatsApp has used role=listitem, cell-frame-container, and aria-label variants.
    scope.querySelectorAll?.('#pane-side [role="listitem"], #pane-side [data-testid*="cell-frame"], [data-testid="chat-list"] [role="listitem"], [aria-label*="Chat list"] [role="listitem"]').forEach((row) => {
      mark(row, 'chat');
      row.querySelectorAll('img').forEach((image) => mark(image, 'avatar'));
    });

    // Known message wrappers and a guarded fallback for message data-id nodes outside the sidebar.
    scope.querySelectorAll?.('#main [data-testid*="msg-container"], #main .message-in, #main .message-out, #main [data-id].message-in, #main [data-id].message-out, #main [data-id^="true_"]').forEach((node) => {
      if (!isInSidePane(node)) mark(node, 'message');
    });

    // Media gets its own mark so it remains protected even when text-message blur is disabled.
    scope.querySelectorAll?.('#main img, #main video, #main [data-testid*="media"] img, #main [data-testid*="sticker"] img').forEach((node) => {
      if (!isInSidePane(node)) mark(node, 'media');
    });

    // Avatars are normally image elements; constrain generic images to recognizable avatar contexts.
    scope.querySelectorAll?.('img').forEach((image) => {
      if (image.closest('[data-testid*="avatar"], [data-testid*="profile"], [aria-label*="profile"], #pane-side')) mark(image, 'avatar');
    });
  }

  function queueProcess() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      process();
    });
  }

  chrome.storage.local.get(DEFAULTS).then((settings) => {
    applySettings(settings);
    process();
    const observer = new MutationObserver((records) => {
      // WhatsApp virtualizes rows; batched, frame-level work avoids processing each mutation.
      if (records.some((record) => record.addedNodes.length)) queueProcess();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }).catch(() => {
    applySettings(DEFAULTS);
    process();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const next = {};
    Object.entries(changes).forEach(([key, change]) => { next[key] = change.newValue; });
    chrome.storage.local.get(DEFAULTS).then((all) => applySettings({ ...all, ...next }));
  });
})();
