import { domId, escapeHtml, formatLatency, formatTime, shortId } from "../shared/format.js";
import { countList, renderMediaRail } from "./media.js";

export function createAuditRenderer({ elements, state, getFilteredEntries }) {
  function renderLoading() {
    elements.auditUpdated.textContent = "正在读取审计记录";
    elements.auditSummary.innerHTML = `
      ${renderSummarySkeleton()}
      ${renderSummarySkeleton()}
      ${renderSummarySkeleton()}
      ${renderSummarySkeleton()}
    `;
    elements.auditList.innerHTML = `
      <div class="audit-skeleton audit-skeleton--row"></div>
      <div class="audit-skeleton audit-skeleton--row"></div>
      <div class="audit-skeleton audit-skeleton--row audit-skeleton--short"></div>
    `;
  }

  function renderSummarySkeleton() {
    return `
      <div class="audit-stat audit-stat--loading">
        <span></span>
        <strong></strong>
        <em></em>
      </div>
    `;
  }

  function renderSummary(entries) {
    const total = entries.length;
    const completed = entries.filter((entry) => entry.status === "completed").length;
    const errors = entries.filter((entry) => entry.status === "error").length;
    const imageCount = entries.reduce((sum, entry) => sum + countList(entry.images), 0);
    const latencies = entries
      .map((entry) => Number(entry.latencyMs))
      .filter((value) => Number.isFinite(value) && value > 0);
    const avgLatency = latencies.length
      ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length
      : 0;

    elements.auditSummary.innerHTML = `
      ${renderStat("总任务", total, "最近 100 条", "", "all")}
      ${renderStat("完成", completed, `${total ? Math.round((completed / total) * 100) : 0}% success`, "", "completed")}
      ${renderStat("错误", errors, errors ? "点击查看错误" : "无错误记录", errors ? "danger" : "", "error")}
      ${renderStat("结果图", imageCount, `均值耗时 ${formatLatency(avgLatency)}`)}
    `;
  }

  function renderStat(label, value, meta, tone = "", statusShortcut = "") {
    const toneClass = tone ? ` audit-stat--${tone}` : "";
    const activeClass = statusShortcut && state.status === statusShortcut ? " is-active" : "";
    const buttonClass = statusShortcut ? " audit-stat--button" : "";
    const tag = statusShortcut ? "button" : "div";
    const attrs = statusShortcut
      ? ` type="button" data-status-shortcut="${escapeHtml(statusShortcut)}" aria-pressed="${state.status === statusShortcut}"`
      : "";
    return `
      <${tag} class="audit-stat${toneClass}${buttonClass}${activeClass}"${attrs}>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <em>${escapeHtml(meta)}</em>
      </${tag}>
    `;
  }

  function renderAudit() {
    const entries = getFilteredEntries();
    if (!entries.length) {
      elements.auditList.innerHTML = `
        <div class="audit-empty">
          <strong>没有匹配的审计记录</strong>
          <span>调整搜索词或切换状态筛选。</span>
        </div>
      `;
      return;
    }
    const visibleEntries = entries.slice(0, state.visibleCount);
    elements.auditList.innerHTML = "";
    visibleEntries.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = "audit-card fade-in";
      card.style.animationDelay = `${Math.min(index * 0.018, 0.18)}s`;
      card.innerHTML = buildAuditCard(entry);
      elements.auditList.appendChild(card);
    });
    if (visibleEntries.length < entries.length) {
      const more = document.createElement("div");
      more.className = "audit-more";
      more.innerHTML = `
        <span>已显示 ${visibleEntries.length} / ${entries.length} 条</span>
        <button class="chip-button" type="button" data-load-more>
          <span>加载更多</span>
        </button>
      `;
      elements.auditList.appendChild(more);
    }
  }

  function buildAuditCard(entry) {
    const status = entry.status || "unknown";
    const statusClass = status === "completed" ? "ok" : status === "error" ? "error" : "pending";
    const taskId = entry.taskId || "-";
    const styleTitle = entry.styleTitle || entry.styleId || "未指定风格";
    const imageCount = countList(entry.images);
    const refCount = countList(entry.references);
    const hasMedia = imageCount + refCount > 0;
    const mediaPanelId = `audit-media-${domId(taskId)}`;
    const promptBlocks = [
      renderPrompt("模版提示词", entry.promptTemplate),
      renderPrompt("用户内容", entry.promptUser),
      renderPrompt("最终提示词", entry.promptFinal),
      renderPrompt("负面提示词", entry.negative),
    ].join("");
    const error = entry.error ? `<div class="audit-error">错误：${escapeHtml(entry.error)}</div>` : "";

    return `
      <header class="audit-card__header">
        <div class="audit-card__identity">
          <span class="audit-card__type">${escapeHtml(entry.type === "ppt" ? "PPT" : "IMAGE")}</span>
          <div>
            <h2 class="audit-card__title" title="${escapeHtml(taskId)}">任务 ${escapeHtml(shortId(taskId))}</h2>
            <p title="${escapeHtml(styleTitle)}">${escapeHtml(styleTitle)}</p>
          </div>
        </div>
        <div class="audit-card__badges">
          <span class="audit-status-pill audit-status-pill--${statusClass}">${escapeHtml(getStatusLabel(status))}</span>
          <span class="audit-card__time">${escapeHtml(formatTime(entry.createdAt))}</span>
        </div>
      </header>

      <div class="audit-card__metrics">
        ${renderMetric("模型", entry.model || "-")}
        ${renderMetric("比例", entry.aspect || "-")}
        ${renderMetric("尺寸", entry.size || "-")}
        ${renderMetric("耗时", formatLatency(entry.latencyMs))}
        ${renderMetric("素材", getMediaCountLabel(refCount, imageCount))}
      </div>

      ${error}
      <p class="audit-card__preview">${escapeHtml(getPromptPreview(entry))}</p>

      <div class="audit-card__controls">
        <details class="audit-block">
          <summary>
            <span>完整提示词</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </summary>
          <div class="audit-block__content">
            ${promptBlocks || `<div class="audit-prompt audit-prompt--empty">没有可展开的提示词记录。</div>`}
          </div>
        </details>
        <button class="chip-button chip-button--ghost chip-button--micro" type="button" data-load-images aria-expanded="false" aria-controls="${escapeHtml(mediaPanelId)}" ${hasMedia ? "" : "disabled"}>
          <span>${escapeHtml(getMediaLabel(refCount, imageCount))}</span>
        </button>
      </div>

      <footer class="audit-card__footer">
        <span title="${escapeHtml(taskId)}">${escapeHtml(taskId)}</span>
      </footer>

      <div class="audit-card__media" id="${escapeHtml(mediaPanelId)}" data-media-panel hidden>
        ${renderMediaRail(entry.references, entry.images)}
      </div>
    `;
  }

  return { renderLoading, renderSummary, renderAudit };
}

function renderMetric(label, value) {
  return `
    <div class="audit-metric">
      <span>${escapeHtml(label)}</span>
      <strong title="${escapeHtml(value)}">${escapeHtml(value)}</strong>
    </div>
  `;
}

function getPromptPreview(entry) {
  const text = String(entry.promptUser || entry.promptFinal || entry.error || "").trim();
  if (!text) return "该任务没有可展示的提示词预览。";
  return text.length > 150 ? `${text.slice(0, 150)}...` : text;
}

function renderPrompt(title, value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `
    <section class="audit-prompt">
      <div class="audit-prompt__title">${escapeHtml(title)}</div>
      <pre class="audit-prompt__body" tabindex="-1">${escapeHtml(text)}</pre>
    </section>
  `;
}

export function getStatusLabel(status) {
  const labels = {
    completed: "完成",
    error: "错误",
    pending: "进行中",
  };
  return labels[status] || status || "未知";
}

function getMediaCountLabel(refCount, imageCount) {
  const parts = [];
  if (refCount) parts.push(`参考 ${refCount}`);
  if (imageCount) parts.push(`结果 ${imageCount}`);
  return parts.length ? parts.join(" / ") : "无";
}

function getMediaLabel(refCount, imageCount) {
  const total = refCount + imageCount;
  if (!total) return "无素材";
  if (refCount && imageCount) return `加载参考 ${refCount} / 结果 ${imageCount}`;
  if (refCount) return `加载参考图 ${refCount} 张`;
  return `加载结果图 ${imageCount} 张`;
}
