function makeInfographicPrompt(styleName, styleRules) {
  return `# 风格规则

你是一位擅长中文信息图设计的视觉设计师。请将用户内容转化为「${styleName}」风格的信息图。

视觉风格
${styleRules}

文字与排版
- 标题与正文只能来自用户内容，不要添加无关文案
- 将文本作为核心视觉元素，保证中文清晰可读
- 优先精简文字，避免大段文字糊成一片
- 根据信息层级拆分标题、关键点、短说明和数字标签
- 排版需要有明确阅读顺序，适合手机竖屏浏览

输出
- 直接生成符合上述风格的信息图，中文，不需要解释
- 图片比例9:16
- 画面内容严格依据用户内容`;
}

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
    id: "cyber-neon-flow",
    title: "赛博霓虹数据流",
    description: "深黑背景、霓虹数据线和 HUD 界面，适合科技日报与趋势解读。",
    tags: ["赛博朋克", "霓虹", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "赛博霓虹数据流",
      "- 深黑色背景，高对比度荧光色调\n- 霓虹灯光、流动数字数据线和全息投影效果\n- 加入 HUD 界面元素、扫描线、数据节点和体积光照\n- 艺术化排版，文本像系统面板、数据标签和发光模块一样嵌入画面\n- 8K分辨率，大师级杰作",
    ),
    negative: "低对比度, 文字糊掉, 过度拥挤, 错别字",
  },
  {
    id: "holographic-glass-ui",
    title: "全息玻璃界面",
    description: "磨砂玻璃、蓝色光粒与未来 FUI，适合产品架构和技术说明。",
    tags: ["全息", "玻璃拟态", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "全息玻璃界面",
      "- 电影级全息 FUI 界面信息图\n- 磨砂透明玻璃材质，悬浮蓝色光粒和精致光晕\n- 光线追踪质感，高级色散、折射和半透明层叠\n- 文本放置在透明面板、悬浮卡片和光线连接节点中\n- 8K分辨率，大师级杰作",
    ),
    negative: "厚重卡片, 低清晰度, 文字变形, 杂乱背景",
  },
  {
    id: "minimal-dark-mode",
    title: "超极简暗黑模式",
    description: "纯黑留白、金白细线和克制信息流，适合高端摘要页。",
    tags: ["极简", "暗黑", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "超极简暗黑模式",
      "- 极简主义暗黑模式信息图，纯黑背景\n- 仅使用纤细的金色和白色发光线条\n- 极大留白空间，文本是唯一视觉焦点\n- 用少量线框、编号、短横线和微弱光点组织信息流\n- 8K分辨率，大师级杰作",
    ),
    negative: "花哨装饰, 彩色渐变, 密集文字, 厚重阴影",
  },
  {
    id: "c4d-crystal-geometry",
    title: "C4D几何晶体",
    description: "半透明低多边形晶体与柔和内光，适合概念拆解。",
    tags: ["C4D", "晶体", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "C4D几何晶体",
      "- 几何晶体低多边形信息图，C4D渲染质感\n- 棱角分明的半透明几何体，柔和内部光源\n- 模块化排版，文本像刻印或投影一样放置在晶体表面\n- 通过晶体块、连接线和光点表达信息层级\n- 8K分辨率，大师级杰作",
    ),
    negative: "塑料感过强, 文字遮挡, 信息无层级, 模糊",
  },
  {
    id: "swiss-grid",
    title: "瑞士极简网格",
    description: "严格网格、黑白粗体和理性留白，适合报告摘要。",
    tags: ["瑞士风格", "网格", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "瑞士极简网格",
      "- 经典瑞士国际主义风格信息图\n- 严格网格系统，大量留白，黑白高对比配色\n- 使用粗体标题、清晰编号、理性分栏和精确对齐\n- 将文本作为排版艺术核心，整体极度干净\n- 8K分辨率，大师级杰作",
    ),
    negative: "装饰过多, 手写字体, 复杂背景, 低可读性",
  },
  {
    id: "corporate-flat",
    title: "当代企业扁平",
    description: "深色企业背景、几何图标和中心图表，适合业务说明。",
    tags: ["企业", "扁平", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "当代企业扁平",
      "- 现代企业扁平化矢量插画信息图\n- 高对比度深色背景，使用清晰几何图形图标\n- 柔和微弱投影，信息整合进中心图表区域\n- 采用流程图、环形图、箭头和模块卡片呈现内容\n- 8K分辨率，大师级杰作",
    ),
    negative: "过度卡通, 文字过小, 低对比度, 花哨纹理",
  },
  {
    id: "ceramic-relief",
    title: "高端陶瓷浮雕",
    description: "哑光白陶瓷与香槟金线条，适合品牌级概念介绍。",
    tags: ["陶瓷", "浮雕", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "高端陶瓷浮雕",
      "- 极简主义信息图，哑光白色陶瓷材质\n- 点缀香槟金金属线条，柔和漫射光\n- 文本以浅浮雕或烫金方式呈现，精致但清晰\n- 黄金比例构图，使用细线、浅刻槽和留白强化层级\n- 8K分辨率，大师级杰作",
    ),
    negative: "脏污纹理, 强阴影, 低端塑料感, 文字不清",
  },
  {
    id: "paper-cut-relief",
    title: "多层纸艺浮雕",
    description: "纸张堆叠、真实阴影和层次模块，适合教育与故事类内容。",
    tags: ["纸艺", "浮雕", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "多层纸艺浮雕",
      "- 复杂纸艺浮雕信息图，多层纸张堆叠\n- 真实阴影、景深和细腻纹理纸材质\n- 文本被裁剪并放置在不同纸层上，营造层次感\n- 动态模块化排版，用纸片、镂空和阶梯表达结构\n- 8K分辨率，大师级杰作",
    ),
    negative: "纸层杂乱, 文字被裁断, 过暗, 低清晰度",
  },
  {
    id: "vintage-pen-manuscript",
    title: "复古钢笔手稿",
    description: "羊皮纸、蚀刻线稿和手稿标注，适合历史脉络与知识科普。",
    tags: ["复古", "手稿", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "复古钢笔手稿",
      "- 维多利亚时期复古蚀刻版画风格信息图\n- 泛黄羊皮纸纹理，精细钢笔线条和手稿边注\n- 文本呈现古老手写字体风格，但必须保持中文可读\n- 使用卷轴、线框、编号标注和细密插画强化历史感\n- 8K分辨率，大师级杰作",
    ),
    negative: "过度潦草, 字迹不可读, 污渍过多, 现代霓虹",
  },
  {
    id: "abstract-fluid-art",
    title: "抽象流体艺术",
    description: "液态玻璃和丝绸渐变，适合创意概念和品牌故事。",
    tags: ["流体", "艺术", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "抽象流体艺术",
      "- 抽象流体艺术信息图，液态玻璃材质\n- 丝绸般流动渐变，高饱和度迷幻配色\n- 文本以透明气泡、漂浮标签或流动路径形式嵌入画面\n- 构图富有创造力，但文字区域保持足够干净\n- 8K分辨率，大师级杰作",
    ),
    negative: "背景吞字, 文字扭曲, 过度混色, 无阅读顺序",
  },
  {
    id: "memphis-pop",
    title: "孟菲斯几何波普",
    description: "亮黄、电光蓝、粉红撞色与80年代图案，适合轻快内容。",
    tags: ["孟菲斯", "波普", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "孟菲斯几何波普",
      "- 孟菲斯波普艺术风格信息图\n- 大胆撞色，包括亮黄、电光蓝和粉红\n- 几何图案、波浪线、圆点、锯齿和80年代复古装饰\n- 文本使用粗体字位于中心或分区模块，周围环绕装饰元素\n- 8K分辨率，大师级杰作",
    ),
    negative: "颜色脏乱, 文字拥挤, 低对比度, 成人商务沉闷风",
  },
  {
    id: "industrial-blueprint",
    title: "工业蓝图设计",
    description: "蓝底白线、CAD 标注和技术网格，适合工程与技术流程。",
    tags: ["蓝图", "工业", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "工业蓝图设计",
      "- 复杂工业蓝图风格信息图，蓝底白线\n- CAD制图美学，网格背景、比例尺、尺寸线和技术标注\n- 文本整合为蓝图上的说明、编号、参数框和结构注释\n- 动态排版，技术感强，信息路径清晰\n- 8K分辨率，大师级杰作",
    ),
    negative: "手绘涂鸦, 霓虹彩色, 标注过密, 文字模糊",
  },
  {
    id: "eco-watercolor",
    title: "生态水彩渲染",
    description: "水彩晕染、叶脉藤蔓和自然笔触，适合生态与健康主题。",
    tags: ["水彩", "生态", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "生态水彩渲染",
      "- 有机生态风格信息图，柔和水彩晕染和笔触\n- 植物叶脉、藤蔓、花瓣和自然曲线元素\n- 文本以清晰手写水彩字体融入自然背景\n- 信息流像枝叶生长一样展开，轻盈、亲和、可读\n- 8K分辨率，大师级杰作",
    ),
    negative: "颜色浑浊, 文字水化不可读, 过度写实照片, 杂乱",
  },
  {
    id: "chalkboard-sketch",
    title: "黑板粉笔手绘",
    description: "黑板纹理、粉笔涂鸦和课堂式模块，适合知识讲解。",
    tags: ["黑板", "粉笔", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "黑板粉笔手绘",
      "- 高细节黑板粉笔手绘风格信息图\n- 粗糙石墨纹理，生动粉笔线条和涂鸦插画\n- 文本以白色和彩色粉笔字迹写在黑板中央或分区框中\n- 模块化排版，使用箭头、圈注、公式感标记和简笔图示\n- 8K分辨率，大师级杰作",
    ),
    negative: "粉尘过重, 文字糊掉, 低对比度, 过度复杂",
  },
  {
    id: "clay-cute-3d",
    title: "粘土拟物化Q版",
    description: "圆润 3D 粘土字和糖果配色，适合轻松产品介绍。",
    tags: ["粘土", "Q版", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "粘土拟物化Q版",
      "- 粘土拟物风格信息图，圆润3D形状\n- 磨砂塑料质感，明亮糖果配色和柔和光照\n- 文本被塑造成可爱的3D粘土字母或嵌入圆润标签\n- 动态构图，加入小图标、小道具和轻松场景层次\n- 8K分辨率，大师级杰作",
    ),
    negative: "恐怖谷, 文字变形, 过度幼稚, 材质脏乱",
  },
  {
    id: "gold-emboss-texture",
    title: "烫金浮雕纹理",
    description: "深色哑光、金色浮雕和皮革绒面纹理，适合高端总结页。",
    tags: ["烫金", "奢华", "9:16"],
    aspect: "9:16",
    prompt: makeInfographicPrompt(
      "烫金浮雕纹理",
      "- 高端烫金浮雕信息图，黑色或深蓝色哑光背景\n- 文本采用精细金色浮雕 Gold Emboss 效果\n- 皮革或绒面纹理，精致奢华但不过度装饰\n- 黄金比例构图，使用金线、压纹、徽章和分隔纹理组织内容\n- 8K分辨率，大师级杰作",
    ),
    negative: "廉价金属感, 文字反光不可读, 过暗, 装饰堆砌",
  },
];

const elements = {
  templateGrid: document.getElementById("template-grid"),
  userContent: document.getElementById("user-content"),
  prompt: document.getElementById("prompt"),
  negative: document.getElementById("negative"),
  aspect: document.getElementById("aspect"),
  size: document.getElementById("size"),
  modelModes: document.querySelectorAll('input[name="model-mode"]'),
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
    const tags = (template.tags || [])
      .map((tag) => `<span class="template-tag">${tag}</span>`)
      .join("");
    card.innerHTML = `
      <h4>${template.title}</h4>
      <p>${template.description}</p>
      <div class="template-card__tags">${tags}</div>
      <span class="template-card__check" aria-hidden="true">已选</span>
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

function setModelStatus(model, size, outlineModel) {
  if (!model) {
    elements.modelStatus.textContent = `策略：${selectedModelModeLabel()} | 模型：生成后显示`;
    return;
  }
  if (outlineModel) {
    elements.modelStatus.textContent = size
      ? `模型：${outlineModel} → ${model} | 尺寸：${size}`
      : `模型：${outlineModel} → ${model}`;
    return;
  }
  elements.modelStatus.textContent = size ? `模型：${model} | 尺寸：${size}` : `模型：${model}`;
}

function selectedModelMode() {
  const selected = document.querySelector('input[name="model-mode"]:checked');
  return selected?.value === "speed" ? "speed" : "quality";
}

function selectedModelModeLabel() {
  return selectedModelMode() === "speed" ? "速度优先" : "质量优先";
}

function buildPrompt() {
  const userText = elements.userContent.value.trim();
  const templateText = applyAspectToPrompt(
    elements.prompt.value.trim(),
    elements.aspect.value || "16:9"
  );
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

function applyAspectToPrompt(templateText, aspect) {
  if (!templateText) {
    return "";
  }
  const ratioLine = `- 图片比例${aspect}`;
  if (templateText.includes("- 图片比例")) {
    return templateText.replace(/- 图片比例[^\n]*/g, ratioLine);
  }
  return `${templateText}\n${ratioLine}`;
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
    modelMode: selectedModelMode(),
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

  setStatus(`正在生成中，${selectedModelModeLabel()}...`, "");
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
    const freshUrl = URL.createObjectURL(blob);
    link.href = freshUrl;
    setTimeout(() => URL.revokeObjectURL(freshUrl), 10_000);
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
    const freshUrl = URL.createObjectURL(blob);
    link.href = freshUrl;
    setTimeout(() => URL.revokeObjectURL(freshUrl), 10_000);
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
        if (task.type === "ppt" && task.totalSlides) {
          const done = task.completedSlides || 0;
          setStatus(`正在生成第 ${Math.min(done + 1, task.totalSlides)} / ${task.totalSlides} 页...`, "");
        } else {
          setStatus("生成中，请稍候...", "");
        }
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
      setModelStatus(task.model, task.size, task.outlineModel);
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
setModelStatus(null);
updateReferenceUI();
openHistoryDb().then(() => {
  loadHistory();
  resumePendingTask();
});

elements.modelModes.forEach((input) => {
  input.addEventListener("change", () => {
    setModelStatus(null);
    setStatus(`已切换为${selectedModelModeLabel()}。`, "");
  });
});

elements.form.addEventListener("submit", handleGenerate);
if (elements.reset) {
  elements.reset.addEventListener("click", resetPrompt);
}
elements.scrollToForm.addEventListener("click", scrollToForm);
if (elements.toggleEditor) {
  elements.toggleEditor.addEventListener("click", toggleEditor);
}
elements.clearHistory.addEventListener("click", clearHistory);
elements.referenceAdd.addEventListener("click", () => elements.referenceInput.click());
elements.referenceInput.addEventListener("change", handleReferenceInput);
