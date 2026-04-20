const showcaseBasePath = "/assets/style-showcase/2026-04-15";
const showcaseCompressedBasePath = `${showcaseBasePath}/compressed`;

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

const styles = [
  {
    id: "ali-orange-flat",
    title: "浅色阿里橙扁平",
    description: "浅色背景、阿里橙主色调和清爽几何图标，适合通用业务与产品说明。",
    tags: ["扁平", "阿里橙"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("浅色阿里橙扁平", "- 现代企业扁平化矢量插画信息图\n- 浅色干净背景（白色或浅灰），整体色调明亮清爽\n- 主色调为阿里橙（#FF6A00），搭配浅橙、暖灰和白色辅助色\n- 使用清晰几何图形图标，线条简洁、色块扁平\n- 柔和微弱投影，信息整合进中心图表区域\n- 采用流程图、环形图、箭头和模块卡片呈现内容\n- 8K分辨率，大师级杰作"),
    negative: "深色背景, 过度卡通, 文字过小, 花哨纹理, 霓虹色",
  },
  {
    id: "cyber-neon-flow",
    title: "赛博霓虹数据流",
    description: "深黑背景、霓虹数据线和 HUD 界面，适合科技日报与趋势解读。",
    tags: ["赛博朋克", "霓虹"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("赛博霓虹数据流", "- 深黑色背景，高对比度荧光色调\n- 霓虹灯光、流动数字数据线和全息投影效果\n- 加入 HUD 界面元素、扫描线、数据节点和体积光照\n- 艺术化排版，文本像系统面板、数据标签和发光模块一样嵌入画面\n- 8K分辨率，大师级杰作"),
    negative: "低对比度, 文字糊掉, 过度拥挤, 错别字",
  },
  {
    id: "holographic-glass-ui",
    title: "全息玻璃界面",
    description: "磨砂玻璃、蓝色光粒与未来 FUI，适合产品架构和技术说明。",
    tags: ["全息", "玻璃拟态"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("全息玻璃界面", "- 电影级全息 FUI 界面信息图\n- 磨砂透明玻璃材质，悬浮蓝色光粒和精致光晕\n- 光线追踪质感，高级色散、折射和半透明层叠\n- 文本放置在透明面板、悬浮卡片和光线连接节点中\n- 8K分辨率，大师级杰作"),
    negative: "厚重卡片, 低清晰度, 文字变形, 杂乱背景",
  },
  {
    id: "minimal-dark-mode",
    title: "超极简暗黑模式",
    description: "纯黑留白、金白细线和克制信息流，适合高端摘要页。",
    tags: ["极简", "暗黑"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("超极简暗黑模式", "- 极简主义暗黑模式信息图，纯黑背景\n- 仅使用纤细的金色和白色发光线条\n- 极大留白空间，文本是唯一视觉焦点\n- 用少量线框、编号、短横线和微弱光点组织信息流\n- 8K分辨率，大师级杰作"),
    negative: "花哨装饰, 彩色渐变, 密集文字, 厚重阴影",
  },
  {
    id: "c4d-crystal-geometry",
    title: "C4D几何晶体",
    description: "半透明低多边形晶体与柔和内光，适合概念拆解。",
    tags: ["C4D", "晶体"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("C4D几何晶体", "- 几何晶体低多边形信息图，C4D渲染质感\n- 棱角分明的半透明几何体，柔和内部光源\n- 模块化排版，文本像刻印或投影一样放置在晶体表面\n- 通过晶体块、连接线和光点表达信息层级\n- 8K分辨率，大师级杰作"),
    negative: "塑料感过强, 文字遮挡, 信息无层级, 模糊",
  },
  {
    id: "swiss-grid",
    title: "瑞士极简网格",
    description: "严格网格、黑白粗体和理性留白，适合报告摘要。",
    tags: ["瑞士风格", "网格"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("瑞士极简网格", "- 经典瑞士国际主义风格信息图\n- 严格网格系统，大量留白，黑白高对比配色\n- 使用粗体标题、清晰编号、理性分栏和精确对齐\n- 将文本作为排版艺术核心，整体极度干净\n- 8K分辨率，大师级杰作"),
    negative: "装饰过多, 手写字体, 复杂背景, 低可读性",
  },
  {
    id: "corporate-flat",
    title: "当代企业扁平",
    description: "深色企业背景、几何图标和中心图表，适合业务说明。",
    tags: ["企业", "扁平"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("当代企业扁平", "- 现代企业扁平化矢量插画信息图\n- 高对比度深色背景，使用清晰几何图形图标\n- 柔和微弱投影，信息整合进中心图表区域\n- 采用流程图、环形图、箭头和模块卡片呈现内容\n- 8K分辨率，大师级杰作"),
    negative: "过度卡通, 文字过小, 低对比度, 花哨纹理",
  },
  {
    id: "ceramic-relief",
    title: "高端陶瓷浮雕",
    description: "哑光白陶瓷与香槟金线条，适合品牌级概念介绍。",
    tags: ["陶瓷", "浮雕"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("高端陶瓷浮雕", "- 极简主义信息图，哑光白色陶瓷材质\n- 点缀香槟金金属线条，柔和漫射光\n- 文本以浅浮雕或烫金方式呈现，精致但清晰\n- 黄金比例构图，使用细线、浅刻槽和留白强化层级\n- 8K分辨率，大师级杰作"),
    negative: "脏污纹理, 强阴影, 低端塑料感, 文字不清",
  },
  {
    id: "paper-cut-relief",
    title: "多层纸艺浮雕",
    description: "纸张堆叠、真实阴影和层次模块，适合教育与故事类内容。",
    tags: ["纸艺", "浮雕"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("多层纸艺浮雕", "- 复杂纸艺浮雕信息图，多层纸张堆叠\n- 真实阴影、景深和细腻纹理纸材质\n- 文本被裁剪并放置在不同纸层上，营造层次感\n- 动态模块化排版，用纸片、镂空和阶梯表达结构\n- 8K分辨率，大师级杰作"),
    negative: "纸层杂乱, 文字被裁断, 过暗, 低清晰度",
  },
  {
    id: "vintage-pen-manuscript",
    title: "复古钢笔手稿",
    description: "羊皮纸、蚀刻线稿和手稿标注，适合历史脉络与知识科普。",
    tags: ["复古", "手稿"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("复古钢笔手稿", "- 维多利亚时期复古蚀刻版画风格信息图\n- 泛黄羊皮纸纹理，精细钢笔线条和手稿边注\n- 文本呈现古老手写字体风格，但必须保持中文可读\n- 使用卷轴、线框、编号标注和细密插画强化历史感\n- 8K分辨率，大师级杰作"),
    negative: "过度潦草, 字迹不可读, 污渍过多, 现代霓虹",
  },
  {
    id: "abstract-fluid-art",
    title: "抽象流体艺术",
    description: "液态玻璃和丝绸渐变，适合创意概念和品牌故事。",
    tags: ["流体", "艺术"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("抽象流体艺术", "- 抽象流体艺术信息图，液态玻璃材质\n- 丝绸般流动渐变，高饱和度迷幻配色\n- 文本以透明气泡、漂浮标签或流动路径形式嵌入画面\n- 构图富有创造力，但文字区域保持足够干净\n- 8K分辨率，大师级杰作"),
    negative: "背景吞字, 文字扭曲, 过度混色, 无阅读顺序",
  },
  {
    id: "memphis-pop",
    title: "孟菲斯几何波普",
    description: "亮黄、电光蓝、粉红撞色与80年代图案，适合轻快内容。",
    tags: ["孟菲斯", "波普"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("孟菲斯几何波普", "- 孟菲斯波普艺术风格信息图\n- 大胆撞色，包括亮黄、电光蓝和粉红\n- 几何图案、波浪线、圆点、锯齿和80年代复古装饰\n- 文本使用粗体字位于中心或分区模块，周围环绕装饰元素\n- 8K分辨率，大师级杰作"),
    negative: "颜色脏乱, 文字拥挤, 低对比度, 成人商务沉闷风",
  },
  {
    id: "industrial-blueprint",
    title: "工业蓝图设计",
    description: "蓝底白线、CAD 标注和技术网格，适合工程与技术流程。",
    tags: ["蓝图", "工业"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("工业蓝图设计", "- 复杂工业蓝图风格信息图，蓝底白线\n- CAD制图美学，网格背景、比例尺、尺寸线和技术标注\n- 文本整合为蓝图上的说明、编号、参数框和结构注释\n- 动态排版，技术感强，信息路径清晰\n- 8K分辨率，大师级杰作"),
    negative: "手绘涂鸦, 霓虹彩色, 标注过密, 文字模糊",
  },
  {
    id: "eco-watercolor",
    title: "生态水彩渲染",
    description: "水彩晕染、叶脉藤蔓和自然笔触，适合生态与健康主题。",
    tags: ["水彩", "生态"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("生态水彩渲染", "- 有机生态风格信息图，柔和水彩晕染和笔触\n- 植物叶脉、藤蔓、花瓣和自然曲线元素\n- 文本以清晰手写水彩字体融入自然背景\n- 信息流像枝叶生长一样展开，轻盈、亲和、可读\n- 8K分辨率，大师级杰作"),
    negative: "颜色浑浊, 文字水化不可读, 过度写实照片, 杂乱",
  },
  {
    id: "chalkboard-sketch",
    title: "黑板粉笔手绘",
    description: "黑板纹理、粉笔涂鸦和课堂式模块，适合知识讲解。",
    tags: ["黑板", "粉笔"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("黑板粉笔手绘", "- 高细节黑板粉笔手绘风格信息图\n- 粗糙石墨纹理，生动粉笔线条和涂鸦插画\n- 文本以白色和彩色粉笔字迹写在黑板中央或分区框中\n- 模块化排版，使用箭头、圈注、公式感标记和简笔图示\n- 8K分辨率，大师级杰作"),
    negative: "粉尘过重, 文字糊掉, 低对比度, 过度复杂",
  },
  {
    id: "clay-cute-3d",
    title: "粘土拟物化Q版",
    description: "圆润 3D 粘土字和糖果配色，适合轻松产品介绍。",
    tags: ["粘土", "Q版"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("粘土拟物化Q版", "- 粘土拟物风格信息图，圆润3D形状\n- 磨砂塑料质感，明亮糖果配色和柔和光照\n- 文本被塑造成可爱的3D粘土字母或嵌入圆润标签\n- 动态构图，加入小图标、小道具和轻松场景层次\n- 8K分辨率，大师级杰作"),
    negative: "恐怖谷, 文字变形, 过度幼稚, 材质脏乱",
  },
  {
    id: "gold-emboss-texture",
    title: "烫金浮雕纹理",
    description: "深色哑光、金色浮雕和皮革绒面纹理，适合高端总结页。",
    tags: ["烫金", "奢华"],
    aspect: "9:16",
    prompt: makeInfographicPrompt("烫金浮雕纹理", "- 高端烫金浮雕信息图，黑色或深蓝色哑光背景\n- 文本采用精细金色浮雕 Gold Emboss 效果\n- 皮革或绒面纹理，精致奢华但不过度装饰\n- 黄金比例构图，使用金线、压纹、徽章和分隔纹理组织内容\n- 8K分辨率，大师级杰作"),
    negative: "廉价金属感, 文字反光不可读, 过暗, 装饰堆砌",
  },
];

const styleOrder = [
  "ali-orange-flat",
  "corporate-flat",
  "clay-cute-3d",
  "chalkboard-sketch",
  "paper-cut-relief",
  "eco-watercolor",
  "abstract-fluid-art",
  "vintage-pen-manuscript",
  "cyber-neon-flow",
  "holographic-glass-ui",
  "minimal-dark-mode",
  "c4d-crystal-geometry",
  "swiss-grid",
  "ceramic-relief",
  "memphis-pop",
  "industrial-blueprint",
  "gold-emboss-texture",
];

export function listStyles() {
  return styleOrder
    .map((id) => findStyle(id))
    .filter(Boolean)
    .map((style) => ({
      id: style.id,
      title: style.title,
      description: style.description,
      tags: style.tags,
      aspect: style.aspect,
      negative: style.negative || "",
      previewUrl: `${showcaseCompressedBasePath}/${style.id}-16x9.png`,
      originalPreviewUrl: `${showcaseBasePath}/${style.id}-16x9.png`,
    }));
}

export function findStyle(id) {
  const normalized = String(id || "").trim();
  if (!normalized) {
    return null;
  }
  return styles.find((style) => style.id === normalized) || null;
}

export function styleForApi(style) {
  if (!style) {
    return null;
  }
  return {
    ...listStyles().find((item) => item.id === style.id),
    prompt: style.prompt,
  };
}

export function buildStyledPrompt({ style, userContent, aspect, referenceImages }) {
  const content = String(userContent || "").trim();
  if (!style || !content) {
    return content;
  }
  const templatePrompt = applyAspectToPrompt(style.prompt, aspect || style.aspect || "16:9");
  const referenceNote = Array.isArray(referenceImages) && referenceImages.length > 0
    ? "\n\n参考图要求\n- 参考图只用于风格与笔触参考，不要照搬内容\n- 画面内容必须严格依据用户内容"
    : "";
  return `${templatePrompt}${referenceNote}\n\n用户内容\n${content}`;
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
