export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function byId(id) {
  return document.getElementById(id);
}

export function createElement(tag, options = {}) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.textContent != null) node.textContent = options.textContent;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value != null) node.setAttribute(key, String(value));
    });
  }
  return node;
}

export function setHidden(node, hidden) {
  if (!node) return;
  node.classList.toggle("hidden", Boolean(hidden));
  node.hidden = Boolean(hidden);
}

export function setBusy(node, busy) {
  if (!node) return;
  node.disabled = Boolean(busy);
  node.setAttribute("aria-busy", busy ? "true" : "false");
}
