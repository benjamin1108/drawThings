import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { generateImages } from "../src/gemini-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const DAILY_PROMPT = `AI 日报 | 2026年4月15日
一、大模型与产品动态
OpenAI 计划Q2推出新推理模型"Spud" OpenAI 正在筹备代号为"Spud"的新一代推理模型（预计命名 GPT-5o/5.5），基于英伟达 Blackwell 架构。此外，OpenAI 官方已预告将于4月下旬举办2026春季发布会，届时将发布新一代大模型产品，业界对 GPT-6 的预期持续升温。

Anthropic 最快本周推出"AI设计工具" 据报道，Anthropic 即将推出一款基于自然语言的AI设计工具，用户可通过文本描述直接生成UI设计稿，被认为将对 Figma、Adobe 等传统设计工具形成直接冲击。

Moltbook 平台：100万AI智能体自主社交 一个名为 Moltbook 的平台上线，容纳100万个AI智能体在无人类干预的情况下相互交流、社交。这一实验探索了AI-to-AI交互的边界与可能性。

二、机器人与具身智能
谷歌发布 Gemini Robotics-ER 1.6，成功率飙升300% 4月14日深夜，谷歌 DeepMind 发布了 Gemini Robotics-ER 1.6，这是时隔半年多对机器人模型的重大升级。核心亮点包括：新增工业仪表读数能力，结合"Agentic Vision"技术（视觉推理+代码执行），仪表读数成功率从1.5版本的23%跃升至93%；空间推理和多视角判断能力显著增强；与波士顿动力合作，Spot 四足机器人已可实现全自主巡检。

智元机器人：人形机器人成本已低于人工 智元机器人姚卯青透露，在工厂上下料场景中，人形机器人的使用成本已低于人工。此外，人形机器人完成了8小时工厂连续作业直播，验证了工业落地的可行性。

三、芯片与算力
英伟达推出量子计算开源模型"Ising" 英伟达发布了名为"Ising"的量子计算开源模型，利用AI处理复杂运算，涵盖校准和纠错功能。IonQ 等量子计算公司及多家研究机构已开始采用，英伟达预计量子计算市场十年内将大幅增长。英伟达股价连涨十日，黄仁勋预计2027年AI芯片订单达1万亿美元。

CPU成为AI新瓶颈：配比从1:8变1:1 随着AI Agent应用的爆发，CPU与GPU的配比从传统的1:8急剧变化至1:1。被长期低估的CPU正成为AI基础设施的新瓶颈，推理侧对通用算力的需求正在重塑数据中心架构。

AI芯片竞争白热化 2026年全球AI芯片市场规模预计突破2800亿美元，其中推理芯片占比达52%。AMD MI350 推理性能提升35倍，英特尔 Gaudi 3 声称比 H100 快50%，竞争格局加速演变。

四、行业应用与趋势
世界互联网大会亚太峰会在港开幕 峰会聚焦AI治理与数字合作，多国代表就AI安全、跨境数据流通、标准制定等议题展开讨论。

AI赋能电气工程，推动绿色智慧转型 IEEE 在北京举办AI与电气工程融合会议，探讨AI在电力系统智能调度、设备预测性维护等领域的最新进展。

Meta与博通合作开发定制AI芯片 Meta 正与博通联合开发定制AI芯片（MTIA），计划到2029年部署1吉瓦算力，减少对英伟达的依赖。

863计划40周年：国产算力如何"接住"工业AI 中国863计划迎来40周年之际，业界回顾国产算力发展历程，探讨如何以自主可控的算力底座支撑工业AI大规模落地。

五、投资与市场
甲骨文裁员3万人，AI投资回报未达预期 甲骨文宣布裁员约3万人（占比18.5%），外界分析认为其在AI领域的大规模投资短期内未能带来预期回报。

微软接管OpenAI挪威Stargate数据中心 微软正式接管 OpenAI 位于挪威的 Stargate 数据中心，该中心容量达230兆瓦、配备10万台GPU，是目前全球最大的AI训练集群之一。

AI漫画行业：从狂热到崩塌 此前火爆的AI漫画赛道正经历剧烈调整，1.2亿观众见证了这一领域从爆发到泡沫破裂的全过程，引发业界对AI生成内容商业模式可持续性的反思。

六、前沿观点
DeepMind CEO：AGI 5年内实现，影响为工业革命10倍 谷歌 DeepMind CEO 预测通用人工智能（AGI）将在5年内实现，其对人类社会的影响将是工业革命的10倍。

苹果以Claude预算挂钩招聘 据报道，苹果商务团队每人每日获得300美元的 Claude API 预算，并将AI工具使用率与招聘决策挂钩，显示大型科技公司正将AI能力深度融入日常运营。`;

const STYLES = [
  {
    id: "character",
    title: "万物绘色",
    negative: "彩色渐变, 3D, 强阴影, 粗黑外框, 密集文字",
    rules: "- Notion 官方插画感的信息可视化风格\n- 明快但素雅的颜色，整体简约、轻盈\n- 线条粗细不均匀，像马克笔随手画的松弛线稿\n- 图标、人物、图表保持手绘涂鸦感，少量黑色压实画面\n- 标题与要点来自用户内容，文字尽量精简",
  },
  {
    id: "cyber-neon-flow",
    title: "赛博霓虹数据流",
    negative: "低对比度, 文字糊掉, 过度拥挤, 错别字",
    rules: "- 深黑色背景，高对比度荧光色调\n- 霓虹灯光、流动数字数据线和全息投影效果\n- 加入 HUD 界面元素、扫描线、数据节点和体积光照\n- 艺术化排版，文本像系统面板、数据标签和发光模块一样嵌入画面\n- 8K分辨率，大师级杰作",
  },
  {
    id: "holographic-glass-ui",
    title: "全息玻璃界面",
    negative: "厚重卡片, 低清晰度, 文字变形, 杂乱背景",
    rules: "- 电影级全息 FUI 界面信息图\n- 磨砂透明玻璃材质，悬浮蓝色光粒和精致光晕\n- 光线追踪质感，高级色散、折射和半透明层叠\n- 文本放置在透明面板、悬浮卡片和光线连接节点中\n- 8K分辨率，大师级杰作",
  },
  {
    id: "minimal-dark-mode",
    title: "超极简暗黑模式",
    negative: "花哨装饰, 彩色渐变, 密集文字, 厚重阴影",
    rules: "- 极简主义暗黑模式信息图，纯黑背景\n- 仅使用纤细的金色和白色发光线条\n- 极大留白空间，文本是唯一视觉焦点\n- 用少量线框、编号、短横线和微弱光点组织信息流\n- 8K分辨率，大师级杰作",
  },
  {
    id: "c4d-crystal-geometry",
    title: "C4D几何晶体",
    negative: "塑料感过强, 文字遮挡, 信息无层级, 模糊",
    rules: "- 几何晶体低多边形信息图，C4D渲染质感\n- 棱角分明的半透明几何体，柔和内部光源\n- 模块化排版，文本像刻印或投影一样放置在晶体表面\n- 通过晶体块、连接线和光点表达信息层级\n- 8K分辨率，大师级杰作",
  },
  {
    id: "swiss-grid",
    title: "瑞士极简网格",
    negative: "装饰过多, 手写字体, 复杂背景, 低可读性",
    rules: "- 经典瑞士国际主义风格信息图\n- 严格网格系统，大量留白，黑白高对比配色\n- 使用粗体标题、清晰编号、理性分栏和精确对齐\n- 将文本作为排版艺术核心，整体极度干净\n- 8K分辨率，大师级杰作",
  },
  {
    id: "corporate-flat",
    title: "当代企业扁平",
    negative: "过度卡通, 文字过小, 低对比度, 花哨纹理",
    rules: "- 现代企业扁平化矢量插画信息图\n- 高对比度深色背景，使用清晰几何图形图标\n- 柔和微弱投影，信息整合进中心图表区域\n- 采用流程图、环形图、箭头和模块卡片呈现内容\n- 8K分辨率，大师级杰作",
  },
  {
    id: "ceramic-relief",
    title: "高端陶瓷浮雕",
    negative: "脏污纹理, 强阴影, 低端塑料感, 文字不清",
    rules: "- 极简主义信息图，哑光白色陶瓷材质\n- 点缀香槟金金属线条，柔和漫射光\n- 文本以浅浮雕或烫金方式呈现，精致但清晰\n- 黄金比例构图，使用细线、浅刻槽和留白强化层级\n- 8K分辨率，大师级杰作",
  },
  {
    id: "paper-cut-relief",
    title: "多层纸艺浮雕",
    negative: "纸层杂乱, 文字被裁断, 过暗, 低清晰度",
    rules: "- 复杂纸艺浮雕信息图，多层纸张堆叠\n- 真实阴影、景深和细腻纹理纸材质\n- 文本被裁剪并放置在不同纸层上，营造层次感\n- 动态模块化排版，用纸片、镂空和阶梯表达结构\n- 8K分辨率，大师级杰作",
  },
  {
    id: "vintage-pen-manuscript",
    title: "复古钢笔手稿",
    negative: "过度潦草, 字迹不可读, 污渍过多, 现代霓虹",
    rules: "- 维多利亚时期复古蚀刻版画风格信息图\n- 泛黄羊皮纸纹理，精细钢笔线条和手稿边注\n- 文本呈现古老手写字体风格，但必须保持中文可读\n- 使用卷轴、线框、编号标注和细密插画强化历史感\n- 8K分辨率，大师级杰作",
  },
  {
    id: "abstract-fluid-art",
    title: "抽象流体艺术",
    negative: "背景吞字, 文字扭曲, 过度混色, 无阅读顺序",
    rules: "- 抽象流体艺术信息图，液态玻璃材质\n- 丝绸般流动渐变，高饱和度迷幻配色\n- 文本以透明气泡、漂浮标签或流动路径形式嵌入画面\n- 构图富有创造力，但文字区域保持足够干净\n- 8K分辨率，大师级杰作",
  },
  {
    id: "memphis-pop",
    title: "孟菲斯几何波普",
    negative: "颜色脏乱, 文字拥挤, 低对比度, 成人商务沉闷风",
    rules: "- 孟菲斯波普艺术风格信息图\n- 大胆撞色，包括亮黄、电光蓝和粉红\n- 几何图案、波浪线、圆点、锯齿和80年代复古装饰\n- 文本使用粗体字位于中心或分区模块，周围环绕装饰元素\n- 8K分辨率，大师级杰作",
  },
  {
    id: "industrial-blueprint",
    title: "工业蓝图设计",
    negative: "手绘涂鸦, 霓虹彩色, 标注过密, 文字模糊",
    rules: "- 复杂工业蓝图风格信息图，蓝底白线\n- CAD制图美学，网格背景、比例尺、尺寸线和技术标注\n- 文本整合为蓝图上的说明、编号、参数框和结构注释\n- 动态排版，技术感强，信息路径清晰\n- 8K分辨率，大师级杰作",
  },
  {
    id: "eco-watercolor",
    title: "生态水彩渲染",
    negative: "颜色浑浊, 文字水化不可读, 过度写实照片, 杂乱",
    rules: "- 有机生态风格信息图，柔和水彩晕染和笔触\n- 植物叶脉、藤蔓、花瓣和自然曲线元素\n- 文本以清晰手写水彩字体融入自然背景\n- 信息流像枝叶生长一样展开，轻盈、亲和、可读\n- 8K分辨率，大师级杰作",
  },
  {
    id: "chalkboard-sketch",
    title: "黑板粉笔手绘",
    negative: "粉尘过重, 文字糊掉, 低对比度, 过度复杂",
    rules: "- 高细节黑板粉笔手绘风格信息图\n- 粗糙石墨纹理，生动粉笔线条和涂鸦插画\n- 文本以白色和彩色粉笔字迹写在黑板中央或分区框中\n- 模块化排版，使用箭头、圈注、公式感标记和简笔图示\n- 8K分辨率，大师级杰作",
  },
  {
    id: "clay-cute-3d",
    title: "粘土拟物化Q版",
    negative: "恐怖谷, 文字变形, 过度幼稚, 材质脏乱",
    rules: "- 粘土拟物风格信息图，圆润3D形状\n- 磨砂塑料质感，明亮糖果配色和柔和光照\n- 文本被塑造成可爱的3D粘土字母或嵌入圆润标签\n- 动态构图，加入小图标、小道具和轻松场景层次\n- 8K分辨率，大师级杰作",
  },
  {
    id: "gold-emboss-texture",
    title: "烫金浮雕纹理",
    negative: "廉价金属感, 文字反光不可读, 过暗, 装饰堆砌",
    rules: "- 高端烫金浮雕信息图，黑色或深蓝色哑光背景\n- 文本采用精细金色浮雕 Gold Emboss 效果\n- 皮革或绒面纹理，精致奢华但不过度装饰\n- 黄金比例构图，使用金线、压纹、徽章和分隔纹理组织内容\n- 8K分辨率，大师级杰作",
  },
];

const ASPECTS = ["16:9"];

const options = parseArgs(process.argv.slice(2));
const selectedStyles = filterStyles(STYLES, options.only);
const jobs = selectedStyles.flatMap((style) =>
  ASPECTS.map((aspect) => ({ style, aspect }))
);

if (options.help) {
  printHelp();
  process.exit(0);
}

if (!jobs.length) {
  console.error("No styles matched --only.");
  process.exit(1);
}

const outDir = path.resolve(rootDir, options.out);
const manifestPath = path.join(outDir, "manifest.json");
const model = options.model || resolveFastModel();
const startedAt = new Date().toISOString();
const manifest = {
  generatedAt: startedAt,
  promptDate: "2026-04-15",
  modelMode: "speed",
  model: model || null,
  size: options.size || null,
  outDir: path.relative(rootDir, outDir),
  items: [],
  errors: [],
};
let manifestWriteQueue = Promise.resolve();
let inFlight = 0;
let finished = 0;
let stopRequested = false;

await fs.promises.mkdir(outDir, { recursive: true });

console.log(`Style showcase generation`);
console.log(`Output: ${path.relative(rootDir, outDir)}`);
console.log(`Styles: ${selectedStyles.length}`);
console.log(`Jobs: ${jobs.length} (${ASPECTS.join(", ")})`);
console.log(`Model: ${model || "gemini-client default"}`);
console.log(`Size: ${options.size || "model default"}`);
console.log(`Skip existing: ${options.skipExisting ? "yes" : "no"}`);
console.log(`Launch interval: ${options.staggerMs}ms`);
console.log("");

await runJobsWithStagger(jobs);

manifest.completedAt = new Date().toISOString();
await saveManifest();

console.log("");
console.log(`Done. Saved ${manifest.items.filter((item) => !item.skipped).length} generated image(s), ${manifest.items.filter((item) => item.skipped).length} skipped, ${manifest.errors.length} error(s).`);
console.log(`Manifest: ${path.relative(rootDir, manifestPath)}`);

async function runJobsWithStagger(allJobs) {
  const running = [];
  for (let index = 0; index < allJobs.length; index += 1) {
    if (stopRequested) {
      console.log(`Stop requested; ${allJobs.length - index} job(s) were not started.`);
      break;
    }
    if (index > 0 && options.staggerMs > 0) {
      await sleep(options.staggerMs);
    }
    const promise = runJob(allJobs[index], index).catch((error) => {
      console.error(`      unexpected job error: ${error?.message ?? error}`);
    });
    running.push(promise);
  }
  await Promise.all(running);
}

async function runJob(job, index) {
  const step = `${index + 1}/${jobs.length}`;
  const aspectSlug = job.aspect.replace(":", "x");
  const filename = `${job.style.id}-${aspectSlug}.png`;
  const filePath = path.join(outDir, filename);
  const relPath = path.relative(rootDir, filePath);

  if (options.skipExisting && fs.existsSync(filePath)) {
    const stat = await fs.promises.stat(filePath);
    console.log(`[${step}] Skip existing ${job.style.title} ${job.aspect} -> ${relPath}`);
    manifest.items.push({
      id: job.style.id,
      title: job.style.title,
      aspect: job.aspect,
      path: relPath,
      bytes: stat.size,
      skipped: true,
    });
    finished += 1;
    await saveManifest();
    return;
  }

  const prompt = makeInfographicPrompt(job.style.title, job.style.rules, job.aspect);
  const finalPrompt = `${prompt}\n\n用户内容\n${DAILY_PROMPT}`;
  const started = Date.now();
  inFlight += 1;
  console.log(`[${step}] Start ${job.style.title} ${job.aspect} (in-flight: ${inFlight})`);

  try {
    if (options.dryRun) {
      console.log(`      dry-run: ${relPath}`);
      finished += 1;
      inFlight = Math.max(0, inFlight - 1);
      return;
    }

    const result = await generateImages({
      prompt: finalPrompt,
      count: 1,
      aspect: job.aspect,
      size: options.size,
      negative: job.style.negative,
      model,
    });
    const buffer = Buffer.from(result.images[0], "base64");
    await fs.promises.writeFile(filePath, buffer);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const latencyMs = Date.now() - started;
    manifest.model = result.model || manifest.model;
    manifest.items.push({
      id: job.style.id,
      title: job.style.title,
      aspect: job.aspect,
      path: relPath,
      bytes: buffer.byteLength,
      sha256,
      latencyMs,
      model: result.model,
      size: result.size || null,
    });
    finished += 1;
    inFlight = Math.max(0, inFlight - 1);
    await saveManifest();
    console.log(`      saved ${relPath} (${formatBytes(buffer.byteLength)}, ${formatMs(latencyMs)}; done: ${finished}/${jobs.length}; in-flight: ${inFlight})`);
  } catch (error) {
    const latencyMs = Date.now() - started;
    const message = error?.message ?? String(error);
    manifest.errors.push({
      id: job.style.id,
      title: job.style.title,
      aspect: job.aspect,
      path: relPath,
      latencyMs,
      error: message,
    });
    finished += 1;
    inFlight = Math.max(0, inFlight - 1);
    await saveManifest();
    console.error(`      failed ${job.style.title} ${job.aspect}: ${message}`);
    console.error(`      done: ${finished}/${jobs.length}; in-flight: ${inFlight}`);
    if (options.stopOnError) {
      stopRequested = true;
    }
  }
}

function makeInfographicPrompt(styleName, styleRules, aspect) {
  const browsingNote =
    aspect === "9:16"
      ? "适合手机竖屏浏览"
      : "适合桌面横屏、PPT封面或样式展示横幅浏览";
  return `# 风格规则

你是一位擅长中文信息图设计的视觉设计师。请将用户内容转化为「${styleName}」风格的信息图。

视觉风格
${styleRules}

文字与排版
- 标题与正文只能来自用户内容，不要添加无关文案
- 将文本作为核心视觉元素，保证中文清晰可读
- 优先精简文字，避免大段文字糊成一片
- 根据信息层级拆分标题、关键点、短说明和数字标签
- 排版需要有明确阅读顺序，${browsingNote}

输出
- 直接生成符合上述风格的信息图，中文，不需要解释
- 图片比例${aspect}
- 画面内容严格依据用户内容`;
}

function parseArgs(args) {
  const parsed = {
    out: "public/assets/style-showcase/2026-04-15",
    size: "2K",
    model: undefined,
    only: [],
    dryRun: false,
    skipExisting: false,
    stopOnError: false,
    staggerMs: 1000,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") {
      parsed.out = requiredValue(args, i, arg);
      i += 1;
    } else if (arg === "--size") {
      parsed.size = requiredValue(args, i, arg);
      i += 1;
    } else if (arg === "--model") {
      parsed.model = requiredValue(args, i, arg);
      i += 1;
    } else if (arg === "--only") {
      parsed.only = requiredValue(args, i, arg).split(",").map((item) => item.trim()).filter(Boolean);
      i += 1;
    } else if (arg === "--stagger-ms") {
      parsed.staggerMs = Number(requiredValue(args, i, arg));
      if (!Number.isFinite(parsed.staggerMs) || parsed.staggerMs < 0) {
        throw new Error("--stagger-ms must be a non-negative number.");
      }
      i += 1;
    } else if (arg === "--skip-existing") {
      parsed.skipExisting = true;
    } else if (arg === "--no-skip-existing") {
      parsed.skipExisting = false;
    } else if (arg === "--stop-on-error") {
      parsed.stopOnError = true;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function requiredValue(args, index, name) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function resolveFastModel() {
  const envModels = parseModelList(process.env.GEMINI_MODEL);
  return process.env.GEMINI_IMAGE_FAST_MODEL || envModels[0] || undefined;
}

function parseModelList(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return [];
  }
  const withoutBrackets = raw.startsWith("[") && raw.endsWith("]")
    ? raw.slice(1, -1)
    : raw;
  return withoutBrackets
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function filterStyles(styles, only) {
  if (!only.length) {
    return styles;
  }
  const wanted = new Set(only);
  return styles.filter((style) => wanted.has(style.id) || wanted.has(style.title));
}

async function writeManifest(filePath, manifest) {
  await fs.promises.writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function saveManifest() {
  manifestWriteQueue = manifestWriteQueue.then(() => writeManifest(manifestPath, manifest));
  return manifestWriteQueue;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatMs(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function printHelp() {
  console.log(`Usage:
  node scripts/generate-style-showcase.js [options]

Options:
  --out <dir>              Output directory (default: public/assets/style-showcase/2026-04-15)
  --model <id>             Override image model. Defaults to GEMINI_IMAGE_FAST_MODEL or first GEMINI_MODEL entry.
  --size <size>            Image size like 1K, 2K, 4K (default: 2K).
  --only <ids>             Comma-separated style ids or Chinese titles.
  --stagger-ms <ms>        Delay between starting jobs (default: 1000).
  --skip-existing          Keep existing output PNGs instead of overwriting.
  --no-skip-existing       Regenerate files even when output PNG already exists (default).
  --stop-on-error          Stop after the first failed generation.
  --dry-run                Print planned jobs without calling the API.
  -h, --help               Show this help.

Examples:
  node scripts/generate-style-showcase.js
  node scripts/generate-style-showcase.js --only swiss-grid,赛博霓虹数据流
`);
}
