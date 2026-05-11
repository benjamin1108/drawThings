import { STORAGE_KEYS } from "../shared/storage.js";

export function createCoverflow({ el, state, openStylePreview }) {
  function renderFancards() {
    el.track.innerHTML = "";
    state.cards = state.styles.map((style, index) => {
      const card = document.createElement("div");
      card.className = "fancard";
      card.dataset.index = String(index);
      card.setAttribute("role", "option");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", style.title);

      const img = document.createElement("img");
      img.src = style.previewUrl;
      img.alt = `${style.title} 样图`;
      img.loading = "lazy";
      img.draggable = false;
      card.appendChild(img);

      const caption = document.createElement("span");
      caption.className = "fancard__caption";
      caption.textContent = style.title;
      card.appendChild(caption);

      const zoom = document.createElement("button");
      zoom.type = "button";
      zoom.className = "fancard__zoom";
      zoom.setAttribute("aria-label", "放大查看");
      zoom.innerHTML =
        '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
      zoom.addEventListener("click", (event) => {
        event.stopPropagation();
        openStylePreview(state.styles[index]);
      });
      card.appendChild(zoom);

      card.addEventListener("focus", () => setHoverIndex(index));
      card.addEventListener("click", () => commitActiveIndex(index));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          commitActiveIndex(index);
        }
      });

      el.track.appendChild(card);
      return card;
    });
    layoutFan();
  }

  function layoutFan() {
    const count = state.cards.length;
    if (!count) return;
    const pivot = (count - 1) / 2;
    state.cards.forEach((card, index) => {
      const spread = index - pivot;
      card.style.setProperty("--spread", spread);
      card.style.setProperty("--abs", Math.abs(spread));
      card.classList.toggle("is-active", index === state.activeIndex);
      card.classList.toggle("is-hover", index === state.hoverIndex);
    });
  }

  function setHoverIndex(index) {
    if (state.hoverIndex === index) return;
    state.hoverIndex = index;
    state.cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-hover", cardIndex === index);
    });
    updateActiveMeta();
  }

  function clearHover() {
    if (state.hoverIndex === -1) return;
    state.hoverIndex = -1;
    state.cards.forEach((card) => card.classList.remove("is-hover"));
    updateActiveMeta();
  }

  function updateHoverFromPointer(event) {
    const count = state.cards.length;
    if (!count) return;
    const card = event.target?.closest?.(".fancard");
    if (card?.dataset.index != null) {
      const index = Number.parseInt(card.dataset.index, 10);
      if (!Number.isNaN(index) && index !== state.hoverIndex) setHoverIndex(index);
      return;
    }
    const last = state.cards[count - 1].getBoundingClientRect();
    const first = state.cards[0].getBoundingClientRect();
    const leftEdge = Math.min(first.left, last.left);
    const rightEdge = Math.max(first.right, last.right);
    const span = rightEdge - leftEdge;
    if (span <= 0) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - leftEdge) / span));
    setHoverIndex(Math.round(ratio * (count - 1)));
  }

  function updateMagneticShift(clientX) {
    const area = document.getElementById("fancards");
    if (!area || !el.track || state.activeIndex >= 0) return;
    const rect = area.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(-1, Math.min(1, (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
    const shift = -Math.sign(ratio) * Math.abs(ratio) ** 1.5 * 140;
    el.track.style.setProperty("--shift", `${shift.toFixed(1)}px`);
  }

  function clearMagneticShift() {
    el.track?.style.setProperty("--shift", "0px");
  }

  function recenterActiveCard(card) {
    const area = document.getElementById("fancards");
    if (!card || !area || !el.track) return;
    const areaRect = area.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const currentShift = Number.parseFloat(el.track.style.getPropertyValue("--shift")) || 0;
    const nextShift = currentShift + (areaRect.left + areaRect.width / 2 - (cardRect.left + cardRect.width / 2));
    el.track.style.setProperty("--shift", `${nextShift.toFixed(1)}px`);
  }

  function commitActiveIndex(index) {
    const total = state.styles.length;
    if (!total) return;
    const clamped = ((index % total) + total) % total;
    if (state.activeIndex === clamped) {
      state.activeIndex = -1;
      localStorage.removeItem(STORAGE_KEYS.activeStyle);
    } else {
      state.activeIndex = clamped;
      const style = state.styles[clamped];
      if (style) localStorage.setItem(STORAGE_KEYS.activeStyle, style.id);
      recenterActiveCard(state.cards[clamped]);
    }
    state.cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === state.activeIndex);
    });
    updateSelectionState();
    updateActiveMeta();
  }

  function setActiveNoToggle(index) {
    const total = state.styles.length;
    if (!total) return;
    const clamped = ((index % total) + total) % total;
    state.activeIndex = clamped;
    const style = state.styles[clamped];
    if (style) localStorage.setItem(STORAGE_KEYS.activeStyle, style.id);
    state.cards.forEach((card, cardIndex) => card.classList.toggle("is-active", cardIndex === clamped));
    updateSelectionState();
    updateActiveMeta();
    recenterActiveCard(state.cards[clamped]);
  }

  function updateSelectionState() {
    document.getElementById("fancards")?.classList.toggle("has-selection", state.activeIndex >= 0);
  }

  function updateActiveMeta() {
    const metaIndex = state.activeIndex >= 0 ? state.activeIndex : state.hoverIndex;
    const style = state.styles[metaIndex];
    if (!style) return;
    if (el.flowTitleInner) {
      if (el.flowTitleInner.textContent !== style.title) {
        el.flowTitleInner.textContent = style.title;
        el.flowTitleInner.style.animation = "none";
        void el.flowTitleInner.offsetWidth;
        el.flowTitleInner.style.animation = "";
      }
    } else {
      el.flowTitle.textContent = style.title;
    }
    if (el.flowIndex) {
      el.flowIndex.textContent = `${String(metaIndex + 1).padStart(2, "0")} / ${String(state.styles.length).padStart(2, "0")}`;
    }
    if (el.styleHeroImage) {
      const src = style.originalPreviewUrl || style.previewUrl;
      if (src && el.styleHeroImage.getAttribute("src") !== src) el.styleHeroImage.src = src;
      el.styleHeroImage.alt = `${style.title} 风格预览`;
    }
    el.flowTags.innerHTML = "";
    (style.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      el.flowTags.appendChild(span);
    });
  }

  function bindFanInteraction() {
    const area = document.getElementById("fancards");
    area?.addEventListener("mousemove", (event) => {
      updateHoverFromPointer(event);
      updateMagneticShift(event.clientX);
    });
    area?.addEventListener("mouseleave", () => {
      clearHover();
      if (state.activeIndex < 0) clearMagneticShift();
    });
    el.flowPrev?.addEventListener("click", () => {
      setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex - 1);
    });
    el.flowNext?.addEventListener("click", () => {
      setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex + 1);
    });
    document.addEventListener("keydown", (event) => {
      if (state.mode !== "flow") return;
      if (["TEXTAREA", "INPUT"].includes(document.activeElement?.tagName)) return;
      if (event.key === "ArrowLeft") setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex - 1);
      if (event.key === "ArrowRight") setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex + 1);
    });
  }

  return {
    renderFancards,
    bindFanInteraction,
    setActiveNoToggle,
    updateSelectionState,
    updateActiveMeta,
  };
}
