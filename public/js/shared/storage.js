export const STORAGE_KEYS = {
  userContent: "drawthings.userContent",
  aspect: "drawthings.aspect",
  size: "drawthings.size",
  modelMode: "drawthings.modelMode",
  generationCount: "drawthings.generationCount",
  activeStyle: "drawthings.activeStyle",
  sidebarCollapsed: "drawthings.sidebarCollapsed",
  currentTaskId: "drawthings.currentTaskId",
  editDescription: "drawthings.edit.description",
  editUserNote: "drawthings.edit.userNote",
  editAspect: "drawthings.edit.aspect",
  editSize: "drawthings.edit.size",
  editModelMode: "drawthings.edit.modelMode",
};

export function getStorage(key, fallback = "") {
  return localStorage.getItem(key) ?? fallback;
}

export function setStorage(key, value) {
  localStorage.setItem(key, String(value));
}

export function removeStorage(key) {
  localStorage.removeItem(key);
}
