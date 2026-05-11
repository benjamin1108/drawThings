export function setExpanded(control, expanded) {
  if (!control) return;
  control.setAttribute("aria-expanded", expanded ? "true" : "false");
}

export function closeOnEscape(event, isOpen, close) {
  if (event.key === "Escape" && isOpen()) {
    close();
  }
}

export function focusFirst(root) {
  const target = root?.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  target?.focus();
}
