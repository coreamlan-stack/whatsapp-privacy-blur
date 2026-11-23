/* Dependency-free regression checks for files that can run without Chrome. */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const manifest = JSON.parse(read('manifest.json'));

assert.equal(manifest.manifest_version, 3, 'must be Manifest V3');
assert.deepEqual(manifest.permissions, ['storage'], 'keep permissions minimal');
assert.equal(manifest.commands['toggle-privacy'].suggested_key.default, 'Ctrl+Shift+Y');
['background.js', 'content.js', 'styles.css', 'popup.html', 'popup.css', 'popup.js'].forEach((file) => assert(fs.existsSync(path.join(root, file)), `missing ${file}`));
Object.values(manifest.icons).forEach((file) => {
  const bytes = fs.readFileSync(path.join(root, file));
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${file} is not PNG`);
});
const content = read('content.js');
['MutationObserver', 'WeakSet', 'chrome.storage.onChanged', 'requestAnimationFrame'].forEach((needle) => assert(content.includes(needle), `content script lacks ${needle}`));
const css = read('styles.css');
assert(css.includes('prefers-reduced-motion'), 'must honor reduced-motion');
assert(css.includes('data-wpb-hover="true"'), 'hover must be configurable');
console.log('Static extension checks passed.');
