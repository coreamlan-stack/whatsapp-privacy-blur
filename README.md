# WhatsApp Privacy Blur

A local-only Manifest V3 Chrome extension that selectively blurs WhatsApp Web content. It does not read, save, transmit, or modify messages, contacts, or WhatsApp data.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose this project folder.
3. Open [WhatsApp Web](https://web.whatsapp.com/), then use the toolbar popup to choose what to protect.
4. Press `Ctrl+Shift+Y` (macOS: `Command+Shift+Y`) to toggle privacy mode. Change the shortcut at `chrome://extensions/shortcuts`.

## Architecture

- `background.js` initializes defaults and handles the command toggle.
- `content.js` starts at `document_start`, hides the first frame only while settings load, applies scoped attributes, and batches dynamic DOM work with one `MutationObserver` plus `requestAnimationFrame`.
- `styles.css` blurs only marked chat rows, message wrappers, avatars, and media; hover clears only the hovered target and honors reduced motion.
- The popup persists independent controls in `chrome.storage.local`; storage events synchronize open WhatsApp tabs and popup instances.

## Test strategy

Static checks are suitable without browser access: validate `manifest.json`, parse JavaScript, and inspect that all assets named by the manifest exist. For simulated DOM tests, use fixture markup matching the selectors in `tests/fixtures/whatsapp-like.html` and assert the content script assigns `data-wpb-target` to chat rows, messages, avatars, and media while it excludes the sidebar from message processing.

Run the dependency-free checks with `node tests/static-checks.js` (and `node --check background.js`, `node --check content.js`, and `node --check popup.js`). The fixture is intentionally representative rather than a claim that it matches WhatsApp's live DOM.

Live verification is still required because WhatsApp can change its private, virtualized markup. In Chrome test: initial load/refresh, chat switches, new group and direct messages, a long virtualized history, images/videos/stickers, enabled/disabled hover, shortcut updates, persistence after popup reopen, keyboard navigation, and light/dark system modes. Use DevTools Performance to confirm observer work remains frame-batched during scrolling.

## Selector limitations

WhatsApp does not publish a stable DOM contract. The content script uses several guarded, semantic-ish selectors (`#pane-side`, `#main`, ARIA list items, message containers and `data-testid` fragments), but a markup update can leave a new content type unblurred. Update selectors conservatively after testing against the live DOM; never broaden a selector into inputs, buttons, or the whole app.
