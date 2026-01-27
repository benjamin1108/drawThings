const templates = [
  {
    id: "character",
    title: "万物绘色",
    description: "通用风格规则，万物皆可手绘。",
    tags: ["人物", "松弛线稿", "16:9"],
    aspect: "16:9",
    prompt: `# 风格规则

你是一位擅长 Notion 官方插画风格的信息可视化设计师，能将任何内容转化为松弛感线稿信息图。

视觉风格规范（通用）
- 明快的颜色为主，色彩自由选取，但整体素雅、简约

线条特征
- 线条粗细不均匀，像马克笔随手画的质感
- 笔触松弛、略带抖动，不追求工整
- 所有图标、人物、图表都保持手绘涂鸦感
- 少部分地方填充黑色让整体压实

人物画法（如需要）
- 简笔画风格：女孩或中性人物，短发或简洁发型，圆润的头、点或线表示五官
- 肢体夸张、动作松弛自然
- 可以是完整人物或只露出局部（手、上半身）

排版
- 构图轻盈
- 标题与要点来自用户内容，文字尽量精简

禁止事项
- 不要彩色渐变或复杂配色
- 不要粗黑边框或生硬分隔线
- 不要3D效果、阴影、立体感
- 不要在图中出现Notion信息图字样
- 不要密集文字堆砌
- 装饰元素要克制

输出
- 直接生成符合上述风格的信息图，中文，不需要解释
- 图片比例16:9
- 画面内容严格依据用户内容，不要固定元素或固定文案`,
    negative: "彩色渐变, 3D, 强阴影, 粗黑外框, 密集文字",
  },
  {
    id: "workflow",
    title: "项目流程",
    description: "将项目进度与任务节点转成轻量流程图。",
    tags: ["流程", "节点", "轻量图标"],
    aspect: "16:9",
    prompt: `# 风格规则（流程图向）

视觉风格规范（通用）
- 明快的颜色为主，色彩自由选取，但整体素雅、简约
- 线条粗细不均匀，像马克笔随手画的质感
- 笔触松弛、略带抖动，不追求工整
- 少部分地方填充黑色让整体压实

布局规则
- 手绘流程图布局，节点数量与名称来自用户内容
- 用手绘箭头或曲线连接节点
- 可搭配轻量图标，图标含义来自用户内容
- 标题与说明尽量简短

禁止事项
- 不要彩色渐变或复杂配色
- 不要粗黑边框或生硬分隔线
- 不要3D效果、阴影、立体感
- 不要密集文字堆砌

输出
- 直接生成符合上述风格的信息图，中文，不需要解释
- 图片比例16:9
- 画面内容严格依据用户内容`,
    negative: "渐变, 3D, 强阴影",
  },
  {
    id: "comparison",
    title: "产品对比",
    description: "双栏对比结构，适合功能对照。",
    tags: ["对比", "结构", "极简"],
    aspect: "16:9",
    prompt: `# 风格规则（对比向）

视觉风格规范（通用）
- 明快的颜色为主，色彩自由选取，但整体素雅、简约
- 线条粗细不均匀，像马克笔随手画的质感
- 笔触松弛、略带抖动，不追求工整
- 少部分地方填充黑色让整体压实

布局规则
- 左右双栏或上下对照结构
- 每栏要点来自用户内容，使用中文短句
- 适量手绘涂鸦图标点缀，但不喧宾夺主

禁止事项
- 不要彩色渐变或复杂配色
- 不要粗黑边框或生硬分隔线
- 不要3D效果、阴影、立体感
- 不要密集文字堆砌

输出
- 直接生成符合上述风格的信息图，中文，不需要解释
- 图片比例16:9
- 画面内容严格依据用户内容`,
    negative: "高饱和渐变, 3D, 阴影",
  },
  {
    id: "roadmap",
    title: "路线图",
    description: "时间轴布局的里程碑信息图。",
    tags: ["时间轴", "里程碑", "轻松"],
    aspect: "16:9",
    prompt: `# 风格规则（时间轴向）

视觉风格规范（通用）
- 明快的颜色为主，色彩自由选取，但整体素雅、简约
- 线条粗细不均匀，像马克笔随手画的质感
- 笔触松弛、略带抖动，不追求工整
- 少部分地方填充黑色让整体压实

布局规则
- 手绘时间轴从左到右或上到下
- 节点数量与标题来自用户内容
- 每个节点配简笔图标或小标记
- 保持大面积留白，节奏舒缓

禁止事项
- 不要彩色渐变或复杂配色
- 不要粗黑边框或生硬分隔线
- 不要3D效果、阴影、立体感
- 不要密集文字堆砌

输出
- 直接生成符合上述风格的信息图，中文，不需要解释
- 图片比例16:9
- 画面内容严格依据用户内容`,
    negative: "复杂配色, 阴影, 3D",
  },
];

const elements = {
  templateGrid: document.getElementById("template-grid"),
  userContent: document.getElementById("user-content"),
  prompt: document.getElementById("prompt"),
  negative: document.getElementById("negative"),
  aspect: document.getElementById("aspect"),
  size: document.getElementById("size"),
  status: document.getElementById("status"),
  modelStatus: document.getElementById("model-status"),
  imageGrid: document.getElementById("image-grid"),
  gallerySection: document.getElementById("gallery-section"),
  referenceAdd: document.getElementById("reference-add"),
  referenceInput: document.getElementById("reference-input"),
  referenceGrid: document.getElementById("reference-grid"),
  referenceTip: document.getElementById("reference-tip"),
  historyGrid: document.getElementById("history-grid"),
  historyRules: document.getElementById("history-rules"),
  clearHistory: document.getElementById("clear-history"),
  activeTitle: document.getElementById("active-title"),
  activeDesc: document.getElementById("active-desc"),
  activeTags: document.getElementById("active-tags"),
  scrollToForm: document.getElementById("scroll-to-form"),
  reset: document.getElementById("reset"),
  toggleEditor: document.getElementById("toggle-editor"),
  templateEditor: document.getElementById("template-editor"),
  form: document.getElementById("prompt-form"),
};

let activeTemplate = templates[0];
let editorVisible = false;
let loadingCards = [];
let referenceImages = [];
let lastRequestedCount = 2;
const storageKeys = {
  currentTaskId: "drawthings.currentTaskId",
};

const dbState = {
  db: null,
  ready: null,
};
const HISTORY_LIMIT = 12;

function renderTemplates() {
  elements.templateGrid.innerHTML = "";
  templates.forEach((template, index) => {
    const card = document.createElement("div");
    card.className = "template-card fade-in";
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <h4>${template.title}</h4>
      <p>${template.description}</p>
    `;
    card.addEventListener("click", () => setActiveTemplate(template));
    elements.templateGrid.appendChild(card);
  });
  updateTemplateSelection();
}

function updateTemplateSelection() {
  const cards = elements.templateGrid.querySelectorAll(".template-card");
  cards.forEach((card, index) => {
    card.classList.toggle("active", templates[index].id === activeTemplate.id);
  });
}

function setActiveTemplate(template) {
  activeTemplate = template;
  elements.prompt.value = template.prompt;
  elements.negative.value = template.negative || "";
  elements.aspect.value = template.aspect || "16:9";
  updateActiveCard();
  updateTemplateSelection();
}

function updateActiveCard() {
  elements.activeTitle.textContent = activeTemplate.title;
  elements.activeDesc.textContent = activeTemplate.description;
  elements.activeTags.innerHTML = "";
  activeTemplate.tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    elements.activeTags.appendChild(span);
  });
}

function setStatus(message, tone) {
  elements.status.textContent = message;
  elements.status.style.color = tone === "error" ? "#d6452d" : "";
}

function setModelStatus(model, size) {
  if (!model) {
    elements.modelStatus.textContent = "模型：未选择";
    return;
  }
  elements.modelStatus.textContent = size
    ? `模型：${model} | 尺寸：${size}`
    : `模型：${model}`;
}

function buildPrompt() {
  const userText = elements.userContent.value.trim();
  const templateText = elements.prompt.value.trim();
  if (!userText) {
    return "";
  }
  const referenceNote =
    referenceImages.length > 0
      ? "\n\n参考图要求\n- 参考图只用于风格与笔触参考，不要照搬内容\n- 画面内容必须严格依据用户内容"
      : "";
  if (!templateText) {
    return `${userText}${referenceNote}`;
  }
  return `${templateText}${referenceNote}\n\n用户内容\n${userText}`;
}

function requestedCount() {
  return referenceImages.length > 0 ? 1 : 2;
}

function updateReferenceUI() {
  elements.referenceGrid.innerHTML = "";
  referenceImages.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "reference-item";
    card.innerHTML = `
      <img src="${item.previewUrl}" alt="reference ${index + 1}" />
      <button type="button" data-index="${index}">移除</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      removeReference(index);
    });
    elements.referenceGrid.appendChild(card);
  });
  elements.referenceTip.textContent =
    referenceImages.length > 0 ? "已添加参考图：将生成 1 张结果。" : "";
}

function removeReference(index) {
  const [removed] = referenceImages.splice(index, 1);
  if (removed?.previewUrl) {
    URL.revokeObjectURL(removed.previewUrl);
  }
  updateReferenceUI();
}

async function handleReferenceInput(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }
  const maxRefs = 1;
  const remaining = Math.max(0, maxRefs - referenceImages.length);
  const nextFiles = files.slice(0, remaining);
  const refs = await Promise.all(nextFiles.map(fileToReference));
  const next = refs.filter(Boolean);
  if (!next.length) {
    elements.referenceInput.value = "";
    return;
  }
  referenceImages.forEach((item) => {
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
  referenceImages = [next[0]];
  elements.referenceInput.value = "";
  updateReferenceUI();
}

function fileToReference(file) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith("image/")) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const commaIndex = dataUrl.indexOf(",");
      if (commaIndex === -1) {
        resolve(null);
        return;
      }
      const data = dataUrl.slice(commaIndex + 1);
      const mimeType = file.type || "image/png";
      const previewUrl = URL.createObjectURL(file);
      resolve({ data, mimeType, previewUrl, name: file.name });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function handleGenerate(event) {
  event.preventDefault();
  const templatePrompt = elements.prompt.value.trim();
  const userContent = elements.userContent.value.trim();
  const finalPrompt = buildPrompt();
  const count = requestedCount();
  lastRequestedCount = count;
  const payload = {
    prompt: finalPrompt,
    templatePrompt,
    userContent,
    finalPrompt,
    negative: elements.negative.value.trim(),
    aspect: elements.aspect.value,
    size: elements.size.value,
    count,
    referenceImages: referenceImages.map((item) => ({
      data: item.data,
      mimeType: item.mimeType,
    })),
  };

  if (!payload.prompt) {
    setStatus("请先输入用户内容。", "error");
    return;
  }

  setStatus("正在生成中，请稍候...", "");
  elements.gallerySection.classList.remove("hidden");
  elements.imageGrid.innerHTML = "";
  showLoadingPlaceholder(count);

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "生成失败");
    }

    const data = await response.json();
    const taskId = data.taskId;
    if (!taskId) {
      throw new Error("未获取到任务 ID");
    }
    localStorage.setItem(storageKeys.currentTaskId, taskId);
    pollTask(taskId);
  } catch (error) {
    setStatus(`生成失败：${error?.message ?? error}`, "error");
    hideLoadingPlaceholder();
  }
}

function renderImages(images) {
  if (!images.length) {
    elements.imageGrid.innerHTML = "<p>没有收到图像结果。</p>";
    return;
  }

  images.forEach((base64, index) => {
    const card = createImageCard(base64, index);
    elements.imageGrid.appendChild(card);
  });
}

function resetPrompt() {
  setActiveTemplate(activeTemplate);
  setStatus("已恢复当前模版提示词。", "");
}

function toggleEditor() {
  editorVisible = !editorVisible;
  elements.templateEditor.classList.toggle("hidden", !editorVisible);
  elements.toggleEditor.textContent = editorVisible
    ? "收起模版提示词"
    : "编辑模版提示词";
}

function scrollToForm() {
  document.getElementById("form-area").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function showLoadingPlaceholder(count = lastRequestedCount) {
  document.body.classList.add("is-loading");
  if (loadingCards.length) {
    return;
  }
  const safeCount = Math.max(1, Math.min(2, Number(count) || 1));
  for (let i = 0; i < safeCount; i += 1) {
    const card = document.createElement("div");
    card.className = "image-card skeleton";
    card.innerHTML = `
      <div class="skeleton__content">
        <div class="skeleton__label">生成中</div>
        <div class="skeleton__dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    loadingCards.push(card);
    if (elements.imageGrid.firstChild) {
      elements.imageGrid.insertBefore(card, elements.imageGrid.firstChild);
    } else {
      elements.imageGrid.appendChild(card);
    }
  }
}

function hideLoadingPlaceholder() {
  if (loadingCards.length) {
    loadingCards.forEach((card) => card.remove());
    loadingCards = [];
  }
  document.body.classList.remove("is-loading");
}

function createImageCard(base64, index = 0) {
  const card = document.createElement("div");
  card.className = "image-card fade-in";
  card.style.animationDelay = `${index * 0.05}s`;
  const blob = base64ToBlob(base64, "image/png");
  const objectUrl = URL.createObjectURL(blob);
  card.innerHTML = `
      <img src="${objectUrl}" alt="generated image" />
      <a href="${objectUrl}" download="drawthings-${index + 1}.png">下载</a>
      <div class="image-meta">尺寸读取中...</div>
    `;
  const img = card.querySelector("img");
  const meta = card.querySelector(".image-meta");
  const link = card.querySelector("a");
  img.addEventListener("load", () => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const bytes = blob.size;
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    meta.textContent = `尺寸: ${width} x ${height} | 大小: ${mb}MB`;
  });
  link.addEventListener("click", () => {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  });
  return card;
}

function createImageCardFromBlob(blob, index = 0) {
  const card = document.createElement("div");
  card.className = "image-card fade-in";
  card.style.animationDelay = `${index * 0.05}s`;
  const objectUrl = URL.createObjectURL(blob);
  card.innerHTML = `
      <img src="${objectUrl}" alt="generated image" />
      <a href="${objectUrl}" download="drawthings-${index + 1}.png">下载</a>
      <div class="image-meta">尺寸读取中...</div>
    `;
  const img = card.querySelector("img");
  const meta = card.querySelector(".image-meta");
  const link = card.querySelector("a");
  img.addEventListener("load", () => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const bytes = blob.size;
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    meta.textContent = `尺寸: ${width} x ${height} | 大小: ${mb}MB`;
  });
  link.addEventListener("click", () => {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  });
  return card;
}

function pollTask(taskId) {
  fetch(`/api/tasks/${encodeURIComponent(taskId)}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    })
    .then((task) => {
      if (task.status === "pending") {
        setStatus("生成中，请稍候...", "");
        setTimeout(() => pollTask(taskId), 1200);
        return;
      }
      if (task.status === "error") {
        setStatus(`生成失败：${task.error || "未知错误"}`, "error");
        localStorage.removeItem(storageKeys.currentTaskId);
        hideLoadingPlaceholder();
        return;
      }
      const images = Array.isArray(task.images) ? task.images : [];
      if (images.length) {
        renderImages(images);
        saveHistory(images, task);
      }
      setStatus("完成生成");
      setModelStatus(task.model, task.size);
      localStorage.removeItem(storageKeys.currentTaskId);
      hideLoadingPlaceholder();
    })
    .catch((error) => {
      setStatus(`生成失败：${error?.message ?? error}`, "error");
      localStorage.removeItem(storageKeys.currentTaskId);
      hideLoadingPlaceholder();
    });
}

function saveHistory(images, task) {
  const db = dbState.db;
  if (!db) {
    return;
  }
  const tx = db.transaction("images", "readwrite");
  const store = tx.objectStore("images");
  const createdAt = task.createdAt || new Date().toISOString();
  images.forEach((base64) => {
    const blob = base64ToBlob(base64, "image/png");
    const record = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      blob,
      createdAt,
      model: task.model || "",
      size: task.size || "",
    };
    store.add(record);
  });
  tx.oncomplete = () => {
    trimHistory(db, HISTORY_LIMIT);
    loadHistory();
  };
}

function loadHistory() {
  const db = dbState.db;
  if (!db) {
    return;
  }
  elements.historyGrid.innerHTML = "";
  const tx = db.transaction("images", "readonly");
  const store = tx.objectStore("images");
  const items = [];
  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      items.push(cursor.value);
      cursor.continue();
      return;
    }
    items
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-HISTORY_LIMIT)
      .forEach((entry, index) => {
        if (entry?.blob) {
          const card = createImageCardFromBlob(entry.blob, index);
          elements.historyGrid.appendChild(card);
        }
      });
  };
}

function resumePendingTask() {
  const taskId = localStorage.getItem(storageKeys.currentTaskId);
  if (!taskId) {
    return;
  }
  setStatus("正在恢复任务...", "");
  showLoadingPlaceholder();
  pollTask(taskId);
}

function openHistoryDb() {
  if (dbState.ready) {
    return dbState.ready;
  }
  dbState.ready = new Promise((resolve) => {
    const request = indexedDB.open("drawthings", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      dbState.db = request.result;
      if (elements.historyRules) {
        elements.historyRules.textContent = `历史存储在本地浏览器（IndexedDB），最多保留 ${HISTORY_LIMIT} 张，超出会自动清理最旧记录。`;
      }
      resolve(dbState.db);
    };
    request.onerror = () => {
      resolve(null);
    };
  });
  return dbState.ready;
}

function trimHistory(db, maxItems) {
  const tx = db.transaction("images", "readwrite");
  const store = tx.objectStore("images");
  const items = [];
  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      items.push(cursor.value);
      cursor.continue();
      return;
    }
    items
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, Math.max(0, items.length - maxItems))
      .forEach((entry) => {
        store.delete(entry.id);
      });
  };
}

function clearHistory() {
  const db = dbState.db;
  if (!db) {
    return;
  }
  const tx = db.transaction("images", "readwrite");
  tx.objectStore("images").clear();
  tx.oncomplete = () => {
    elements.historyGrid.innerHTML = "";
    setStatus("历史图片已清理。", "");
  };
}

renderTemplates();
setActiveTemplate(activeTemplate);
setModelStatus("gemini-3-pro-image-preview");
updateReferenceUI();
openHistoryDb().then(() => {
  loadHistory();
  resumePendingTask();
});

elements.form.addEventListener("submit", handleGenerate);
elements.reset.addEventListener("click", resetPrompt);
elements.scrollToForm.addEventListener("click", scrollToForm);
elements.toggleEditor.addEventListener("click", toggleEditor);
elements.clearHistory.addEventListener("click", clearHistory);
elements.referenceAdd.addEventListener("click", () => elements.referenceInput.click());
elements.referenceInput.addEventListener("change", handleReferenceInput);
