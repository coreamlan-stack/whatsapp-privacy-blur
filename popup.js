const DEFAULTS = { enabled: true, chatList: true, messages: true, profilePhotos: true, media: true, revealOnHover: true };
const ids = Object.keys(DEFAULTS);
const status = document.querySelector('#status');
const controls = document.querySelector('#controls');

function render(values) {
  ids.forEach((id) => { document.getElementById(id).checked = Boolean(values[id]); });
  controls.disabled = !values.enabled;
  status.textContent = values.enabled ? 'Privacy protection is on' : 'Privacy protection is off';
  document.body.dataset.enabled = String(values.enabled);
}

chrome.storage.local.get(DEFAULTS).then(render);
ids.forEach((id) => document.getElementById(id).addEventListener('change', (event) => {
  chrome.storage.local.set({ [id]: event.target.checked });
}));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  chrome.storage.local.get(DEFAULTS).then(render);
});
chrome.commands.getAll((commands) => {
  const command = commands.find((item) => item.name === 'toggle-privacy');
  if (command?.shortcut) document.querySelector('#shortcut').textContent = command.shortcut.replace(/\+/g, ' + ');
});
