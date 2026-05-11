import { escapeHtml } from "../shared/format.js";
import { auditImageUrl } from "../shared/media.js";

export function renderMediaRail(references, images) {
  const items = [
    ...renderMediaItems(references, "参考图", "reference"),
    ...renderMediaItems(images, "生成结果", "result"),
  ];
  if (!items.length) return "";
  return `
    <section class="audit-media audit-media--rail">
      <div class="audit-media__head">
        <span>素材</span>
        <em>${escapeHtml(items.length)} 张</em>
      </div>
      <div class="audit-thumbs audit-thumbs--rail">${items.join("")}</div>
    </section>
  `;
}

function renderMediaItems(images, title, tone) {
  const list = Array.isArray(images) ? images : [];
  return list.map((img) => {
    const path = img?.path ? String(img.path) : "";
    const bytes = Number(img?.bytes || 0);
    const mb = bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(2)}MB` : "-";
    const index = img?.index || "-";
    const sha = img?.sha256 ? String(img.sha256).slice(0, 12) : "";
    return `
      <div class="audit-thumb audit-thumb--${escapeHtml(tone)}" data-path="${encodeURIComponent(path)}" data-media-title="${escapeHtml(title)}" data-media-index="${escapeHtml(index)}">
        <div class="audit-thumb__placeholder">
          <span>${escapeHtml(title)}</span>
        </div>
        <div class="audit-thumb__meta">
          <span class="audit-thumb__kind">${escapeHtml(title)}</span>
          <span>#${escapeHtml(index)}</span>
          <span>${escapeHtml(mb)}</span>
          <span>${escapeHtml(sha)}</span>
        </div>
      </div>
    `;
  });
}

export function loadImagesForCard(card) {
  const panel = card.querySelector("[data-media-panel]");
  const button = card.querySelector("[data-load-images]");
  if (panel) panel.hidden = false;
  card.querySelectorAll(".audit-thumb").forEach((thumb) => {
    const encodedPath = thumb.dataset.path;
    if (!encodedPath || thumb.querySelector("img")) return;
    const src = auditImageUrl(decodeURIComponent(encodedPath));
    const link = document.createElement("a");
    link.href = src;
    link.target = "_blank";
    link.rel = "noreferrer";
    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    img.alt = `${thumb.dataset.mediaTitle || "审计素材"} #${thumb.dataset.mediaIndex || ""}`;
    link.appendChild(img);
    thumb.querySelector(".audit-thumb__placeholder")?.remove();
    thumb.insertBefore(link, thumb.firstChild);
  });
  if (!button) return;
  button.setAttribute("aria-expanded", "true");
  button.disabled = true;
  const label = button.querySelector("span");
  if (label) label.textContent = "素材已显示";
}

export function countList(value) {
  return Array.isArray(value) ? value.length : 0;
}
