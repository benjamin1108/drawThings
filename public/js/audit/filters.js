import { getStatusLabel } from "./render.js";
import { loadImagesForCard } from "./media.js";

export function createAuditFilters({ elements, state, renderSummary, renderAudit }) {
  function getFilteredEntries() {
    const query = state.query.trim().toLowerCase();
    return state.entries.filter((entry) => {
      if (state.status !== "all" && entry.status !== state.status) return false;
      if (!query) return true;
      const haystack = [
        entry.taskId,
        entry.status,
        getStatusLabel(entry.status),
        entry.model,
        entry.size,
        entry.aspect,
        entry.styleId,
        entry.styleTitle,
        entry.promptUser,
        entry.promptFinal,
        entry.error,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function setStatusFilter(status, options = {}) {
    state.status = status;
    state.visibleCount = state.pageSize;
    elements.auditStatusFilter.value = status;
    renderSummary(state.entries);
    renderAudit();
    if (options.scroll) {
      elements.auditList.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function resetFilters() {
    state.query = "";
    state.status = "all";
    state.visibleCount = state.pageSize;
    elements.auditSearch.value = "";
    elements.auditStatusFilter.value = "all";
  }

  function bindFilters() {
    elements.auditSummary.addEventListener("click", (event) => {
      const button = event.target.closest("[data-status-shortcut]");
      if (button) setStatusFilter(button.dataset.statusShortcut || "all", { scroll: true });
    });
    elements.auditSearch.addEventListener("input", () => {
      state.query = elements.auditSearch.value;
      state.visibleCount = state.pageSize;
      renderAudit();
    });
    elements.auditStatusFilter.addEventListener("change", () => {
      setStatusFilter(elements.auditStatusFilter.value);
    });
    elements.auditList.addEventListener("click", (event) => {
      const loadMore = event.target.closest("[data-load-more]");
      if (loadMore) {
        state.visibleCount += state.pageSize;
        renderAudit();
        return;
      }
      const loadImages = event.target.closest("[data-load-images]");
      if (loadImages && !loadImages.disabled) {
        const card = loadImages.closest(".audit-card");
        if (card) loadImagesForCard(card);
      }
    });
  }

  return { bindFilters, getFilteredEntries, resetFilters, setStatusFilter };
}
