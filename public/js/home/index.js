import { api } from "../shared/api-client.js";
import { STORAGE_KEYS } from "../shared/storage.js";
import { byId, qs } from "../shared/dom.js";
import { revokeObjectUrl } from "../shared/media.js";
import { createCoverflow } from "./coverflow.js";
import { createGeneration } from "./generation.js";
import { createHistory } from "./history.js";
import { createHomeUi } from "./ui.js";

const el = {
  app: qs(".app"),
  historyToggle: byId("history-toggle"),
  stageFlow: byId("stage-flow"),
  stageCanvas: byId("stage-canvas"),
  track: byId("coverflow-track"),
  flowPrev: byId("flow-prev"),
  flowNext: byId("flow-next"),
  flowTitle: byId("flow-title"),
  flowTitleInner: byId("flow-title-inner"),
  flowTags: byId("flow-tags"),
  flowIndex: byId("flow-index"),
  styleHeroImage: byId("style-hero-image"),
  promptHints: byId("prompt-hints"),
  canvasBack: byId("canvas-back"),
  canvasStyle: byId("canvas-style"),
  canvasZoom: byId("canvas-zoom"),
  canvasDownload: byId("canvas-download"),
  canvasSkeleton: byId("canvas-skeleton"),
  canvasImage: byId("canvas-image"),
  canvasError: byId("canvas-error"),
  canvasErrorText: byId("canvas-error-text"),
  canvasRetry: byId("canvas-retry"),
  form: byId("prompt-form"),
  userContent: byId("user-content"),
  aspect: byId("aspect"),
  size: byId("size"),
  modelMode: byId("model-mode"),
  generationCountPill: byId("generation-count-pill"),
  generationCount: byId("generation-count"),
  status: byId("status"),
  generate: byId("generate"),
  historyList: byId("history-list"),
  historyEmpty: byId("history-empty"),
  historyClear: byId("history-clear"),
  lightbox: byId("lightbox"),
  lightboxImage: byId("lightbox-image"),
  lightboxCaption: byId("lightbox-caption"),
};

const state = {
  styles: [],
  activeIndex: -1,
  hoverIndex: -1,
  cards: [],
  mode: "flow",
  polling: false,
  abortPoll: false,
  lastResultUrl: null,
  lastRequest: null,
  currentBatch: null,
  db: null,
};

const ui = createHomeUi({ el, state });
const coverflow = createCoverflow({ el, state, openStylePreview: ui.openStylePreview });
let generation;
let history;

async function init() {
  history = createHistory({ el, state, openBlobPreview: ui.openBlobPreview, setStatus: (message, tone) => generation.setStatus(message, tone) });
  generation = createGeneration({ el, state, saveHistory: history.saveHistory, showPreview: ui.showPreview });
  ui.bindUI(generation, history);
  ui.bootUi();
  try {
    const data = await api.getStyles();
    state.styles = Array.isArray(data.styles) ? data.styles : [];
  } catch (error) {
    generation.setStatus(`风格加载失败：${error?.message ?? error}`, "error");
    return;
  }
  if (!state.styles.length) {
    generation.setStatus("暂无可用风格", "error");
    return;
  }
  state.activeIndex = 0;
  localStorage.setItem(STORAGE_KEYS.activeStyle, state.styles[0].id);
  coverflow.renderFancards();
  coverflow.bindFanInteraction();
  coverflow.updateSelectionState();
  coverflow.updateActiveMeta();
  await history.openDb();
  history.loadHistory();
  generation.resumePendingTask();
}

window.addEventListener("pagehide", () => revokeObjectUrl(state.lastResultUrl));
init();
