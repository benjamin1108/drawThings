import { byId } from "../shared/dom.js";
import { STORAGE_KEYS } from "../shared/storage.js";
import { revokeObjectUrl } from "../shared/media.js";
import { createUpload } from "./upload.js";
import { createDescription } from "./description.js";
import { createResultViewer } from "./result-viewer.js";

const el = {
  dropzone: byId("dropzone"),
  imageInput: byId("image-input"),
  clearReference: byId("clear-reference"),
  zoomReference: byId("zoom-reference"),
  uploadProgress: byId("upload-progress"),
  uploadProgressFill: byId("upload-progress-fill"),
  uploadProgressLabel: byId("upload-progress-label"),
  uploadProgressValue: byId("upload-progress-value"),
  referencePreview: byId("reference-preview"),
  referenceImage: byId("reference-image"),
  referenceMeta: byId("reference-meta"),
  userNote: byId("user-note"),
  analyzeButton: byId("analyze-button"),
  description: byId("description"),
  descriptionCount: byId("description-count"),
  analysisStatus: byId("analysis-status"),
  resultEmpty: byId("result-empty"),
  resultLoader: byId("result-loader"),
  resultImage: byId("result-image"),
  resultError: byId("result-error"),
  zoomResult: byId("zoom-result"),
  downloadResult: byId("download-result"),
  aspect: byId("edit-aspect"),
  size: byId("edit-size"),
  modelMode: byId("edit-model-mode"),
  regenerateButton: byId("regenerate-button"),
  viewer: byId("edit-viewer"),
  viewerBackdrop: byId("viewer-backdrop"),
  viewerClose: byId("viewer-close"),
  viewerImage: byId("viewer-image"),
  viewerCaption: byId("viewer-caption"),
};

const state = {
  referenceImage: null,
  analyzing: false,
  generating: false,
  uploading: false,
  previewUrl: null,
  resultUrl: null,
};

function setStatus(message, tone = "") {
  el.analysisStatus.textContent = message;
  el.analysisStatus.classList.toggle("is-error", tone === "error");
}

function updateDescriptionState() {
  const text = el.description.value.trim();
  el.descriptionCount.textContent = `${text.length} 字`;
  el.regenerateButton.disabled = !state.referenceImage || !text || state.generating || state.uploading;
  localStorage.setItem(STORAGE_KEYS.editDescription, el.description.value);
}

function restoreSettings() {
  const description = localStorage.getItem(STORAGE_KEYS.editDescription);
  if (description) el.description.value = description;
  const userNote = localStorage.getItem(STORAGE_KEYS.editUserNote);
  if (userNote) el.userNote.value = userNote;
  restoreSelect(el.aspect, STORAGE_KEYS.editAspect);
  restoreSelect(el.size, STORAGE_KEYS.editSize);
  restoreSelect(el.modelMode, STORAGE_KEYS.editModelMode);
  updateDescriptionState();
}

function restoreSelect(select, key) {
  const value = localStorage.getItem(key);
  if (value && [...select.options].some((option) => option.value === value)) select.value = value;
}

function bindPersistence() {
  el.userNote.addEventListener("input", () => localStorage.setItem(STORAGE_KEYS.editUserNote, el.userNote.value));
  el.description.addEventListener("input", updateDescriptionState);
  el.aspect.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.editAspect, el.aspect.value));
  el.size.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.editSize, el.size.value));
  el.modelMode.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.editModelMode, el.modelMode.value));
}

const upload = createUpload({ el, state, setStatus, updateDescriptionState });
const description = createDescription({ el, state, setStatus, updateDescriptionState });
const resultViewer = createResultViewer({ el, state, setStatus, updateDescriptionState });

function init() {
  bindPersistence();
  upload.bindUpload();
  resultViewer.bindViewerActions();
  el.analyzeButton.addEventListener("click", description.analyzeReference);
  restoreSettings();
}

window.addEventListener("pagehide", () => {
  revokeObjectUrl(state.previewUrl);
  revokeObjectUrl(state.resultUrl);
});

init();
