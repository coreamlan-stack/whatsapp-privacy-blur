const DEFAULTS = Object.freeze({
  enabled: true,
  chatList: true,
  messages: true,
  profilePhotos: true,
  media: true,
  revealOnHover: true
});

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(DEFAULTS);
  await chrome.storage.local.set({ ...DEFAULTS, ...current });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-privacy') return;
  const { enabled = DEFAULTS.enabled } = await chrome.storage.local.get('enabled');
  await chrome.storage.local.set({ enabled: !enabled });
});
