import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { generateImages, generateText } from "../../gemini-client.js";
import { sendJson } from "../lib/http.js";
import { safeDataPath } from "../lib/paths.js";
import { buildStyledPrompt } from "./style-service.js";
import { persistImagesToDisk, persistReferenceImagesToDisk } from "./file-store.js";
import { writeAuditEntry } from "./audit-store.js";

const tasks = new Map();

export function resolveFinalPrompt({ body, prompt, userContent, style, aspect, referenceImages }) {
  const explicitFinalPrompt = body.finalPrompt ? String(body.finalPrompt).trim() : "";
  if (explicitFinalPrompt) return explicitFinalPrompt;
  if (style) {
    return buildStyledPrompt({
      style,
      userContent: userContent || prompt,
      aspect,
      referenceImages,
    });
  }
  return prompt;
}

export function createTask(payload) {
  const taskId = randomUUID();
  const createdAt = new Date().toISOString();
  const startedAt = Date.now();
  const task = { id: taskId, status: "pending", createdAt, model: payload.model, size: payload.size };
  tasks.set(taskId, task);
  pruneTasks();

  generateImages(payload)
    .then(async (result) => {
      task.model = result.model;
      task.size = result.size;
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      const savedReferences = await persistReferenceImagesToDisk(payload.referenceImages, taskId, completedAt);
      const savedImages = await persistImagesToDisk(result.images, taskId, completedAt);
      Object.assign(task, {
        auditId: randomUUID(),
        completedAt,
        latencyMs,
        savedImages: savedImages.map((item) => item.path),
        savedReferences: savedReferences.map((item) => item.path),
        downloadUrls: savedImages.map((_, index) => buildTaskImageUrl(taskId, index + 1)),
        status: "completed",
      });
      await writeAuditEntry({
        id: task.auditId,
        taskId,
        status: "completed",
        createdAt,
        completedAt,
        latencyMs,
        model: result.model,
        aspect: payload.aspect,
        size: result.size,
        promptTemplate: payload.templatePrompt || "",
        promptUser: payload.userContent || "",
        promptFinal: payload.finalPrompt || payload.prompt,
        negative: payload.negative || "",
        styleId: payload.styleId || "",
        styleTitle: payload.styleTitle || "",
        images: savedImages,
        references: savedReferences,
      });
    })
    .catch(async (error) => {
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      const savedReferences = await persistReferenceImagesToDisk(payload.referenceImages, taskId, completedAt);
      Object.assign(task, {
        status: "error",
        error: error?.message ?? String(error),
        auditId: randomUUID(),
        completedAt,
        latencyMs,
        savedReferences: savedReferences.map((item) => item.path),
      });
      await writeAuditEntry({
        id: task.auditId,
        taskId,
        status: "error",
        createdAt,
        completedAt,
        latencyMs,
        model: payload.model,
        aspect: payload.aspect,
        size: payload.size,
        promptTemplate: payload.templatePrompt || "",
        promptUser: payload.userContent || "",
        promptFinal: payload.finalPrompt || payload.prompt,
        negative: payload.negative || "",
        styleId: payload.styleId || "",
        styleTitle: payload.styleTitle || "",
        error: task.error,
        images: [],
        references: savedReferences,
      });
    });

  return taskId;
}

export function createPptTask(payload) {
  const taskId = randomUUID();
  const createdAt = new Date().toISOString();
  const startedAt = Date.now();
  const outlineModel = "gemini-3-pro-preview";
  const task = {
    id: taskId,
    type: "ppt",
    status: "pending",
    createdAt,
    model: payload.model,
    size: payload.size,
    totalSlides: 0,
    completedSlides: 0,
    outlineModel,
  };
  tasks.set(taskId, task);
  pruneTasks();

  (async () => {
    try {
      const outlineText = await generateText({ prompt: buildOutlinePrompt(payload.userContent), model: outlineModel });
      const outline = parseOutline(outlineText, payload.userContent);
      const slides = outline.slides || [];
      task.totalSlides = slides.length;
      const images = [];
      for (let index = 0; index < slides.length; index += 1) {
        const result = await generateImages({
          prompt: buildSlidePrompt(payload.stylePrompt, slides[index]),
          count: 1,
          aspect: payload.aspect,
          size: payload.size,
          negative: payload.negative,
          model: payload.model,
        });
        images.push(result.images[0]);
        task.completedSlides = index + 1;
        task.model = result.model;
        task.size = result.size;
      }
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      const savedImages = await persistImagesToDisk(images, taskId, completedAt);
      Object.assign(task, {
        auditId: randomUUID(),
        completedAt,
        latencyMs,
        savedImages: savedImages.map((item) => item.path),
        downloadUrls: savedImages.map((_, index) => buildTaskImageUrl(taskId, index + 1)),
        status: "completed",
      });
      await writePptAudit({ task, payload, taskId, createdAt, completedAt, latencyMs, outlineModel, outlineText, outline, savedImages });
    } catch (error) {
      task.status = "error";
      task.error = error?.message ?? String(error);
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      task.auditId = randomUUID();
      task.completedAt = completedAt;
      task.latencyMs = latencyMs;
      await writePptAudit({ task, payload, taskId, createdAt, completedAt, latencyMs, outlineModel, error: task.error });
    }
  })();

  return taskId;
}

async function writePptAudit({ task, payload, taskId, createdAt, completedAt, latencyMs, outlineModel, outlineText = "", outline = null, savedImages = [], error = "" }) {
  await writeAuditEntry({
    id: task.auditId,
    taskId,
    type: "ppt",
    status: error ? "error" : "completed",
    createdAt,
    completedAt,
    latencyMs,
    outlineModel,
    model: error ? payload.model : task.model,
    aspect: payload.aspect,
    size: error ? payload.size : task.size,
    promptTemplate: payload.templatePrompt || "",
    promptUser: payload.userContent || "",
    promptFinal: outlineText,
    negative: payload.negative || "",
    stylePrompt: payload.stylePrompt || "",
    styleTitle: payload.styleTitle || "",
    styleId: payload.styleId || "",
    outline,
    error: error || undefined,
    images: savedImages,
    references: [],
  });
}

function pruneTasks() {
  const entries = Array.from(tasks.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  while (entries.length > 30) {
    const oldest = entries.shift();
    if (oldest) tasks.delete(oldest.id);
  }
}

export async function sendTaskImage(res, taskId, imageIndex) {
  if (!Number.isInteger(imageIndex) || imageIndex < 1) {
    sendJson(res, 400, { error: "Image index must be a positive integer." });
    return;
  }
  const task = tasks.get(taskId);
  if (!task) {
    sendJson(res, 404, { error: "Task not found." });
    return;
  }
  if (task.status !== "completed") {
    sendJson(res, 409, { error: "Task is not completed." });
    return;
  }
  const savedPath = Array.isArray(task.savedImages) ? task.savedImages[imageIndex - 1] : "";
  const filePath = savedPath ? safeDataPath(savedPath) : null;
  if (!filePath) {
    sendJson(res, 404, { error: "Image not found." });
    return;
  }
  try {
    const stat = await fs.promises.stat(filePath);
    sendPngHeaders(res, taskId, imageIndex, stat.size);
    fs.createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { error: "Image not found." });
  }
}

function sendPngHeaders(res, taskId, imageIndex, contentLength) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", `attachment; filename="generated-${taskId}-${imageIndex}.png"`);
  res.setHeader("Cache-Control", "no-store");
  if (Number.isFinite(contentLength)) res.setHeader("Content-Length", String(contentLength));
}

function buildTaskImageUrl(taskId, imageIndex) {
  return `/api/tasks/${encodeURIComponent(taskId)}/images/${imageIndex}`;
}

export function getTask(taskId) {
  return tasks.get(taskId) || null;
}

export function serializeTask(task) {
  return {
    id: task.id,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt,
    model: task.model,
    size: task.size,
    totalSlides: task.totalSlides,
    completedSlides: task.completedSlides,
    outlineModel: task.outlineModel,
    auditId: task.auditId,
    completedAt: task.completedAt,
    latencyMs: task.latencyMs,
    savedImages: task.savedImages,
    savedReferences: task.savedReferences,
    downloadUrls: task.downloadUrls,
    error: task.error,
  };
}

function buildOutlinePrompt(userContent) {
  return `你是一位专业PPT策划，请将“用户内容”拆分为PPT大纲与要点。\n\n要求：\n- 输出严格JSON，不要任何多余文字\n- JSON格式：{\"title\":\"...\",\"slides\":[{\"title\":\"...\",\"bullets\":[\"...\"]}]}\n- slides数量控制在5-8页，内容少时可降到3-5页\n- bullets每页3-5条，中文短句\n\n用户内容：\n${userContent}`.trim();
}

function parseOutline(text, fallbackContent) {
  const jsonText = extractJsonBlock(String(text || "").trim());
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed?.slides?.length) return parsed;
    } catch {
      // fall through to one-slide outline
    }
  }
  return { title: "", slides: [{ title: "概览", bullets: [fallbackContent] }] };
}

function extractJsonBlock(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  return first !== -1 && last !== -1 && last > first ? text.slice(first, last + 1) : "";
}

function buildSlidePrompt(stylePrompt, slide) {
  const title = slide?.title ? String(slide.title) : "页面标题";
  const bullets = Array.isArray(slide?.bullets) ? slide.bullets : [];
  const bulletText = bullets.filter(Boolean).map((item) => `- ${item}`).join("\n");
  return `${stylePrompt}\n\nPPT页面内容\n标题：${title}\n要点：\n${bulletText}\n\n输出\n- 直接生成符合上述风格的信息图，中文，不需要解释\n- 图片比例16:9`.trim();
}

export function buildImageDescriptionPrompt(userNote) {
  const note = String(userNote || "").trim();
  const noteBlock = note ? `\n\n用户补充意图：\n${note}` : "";
  return `你是一位极其严谨的图像复刻提示词工程师。请观察用户上传的参考图，输出一份“可编辑的图像规格说明”，用于后续重新生成一张风格几乎一致、只改用户局部文字或局部样式的图片。

核心目标：
- 最大限度保留参考图的整体视觉语言、构图、镜头、主体比例、空间关系、排版系统、字体气质、色彩、光影、材质、纹理、背景和细节密度。
- 你的输出会被用户直接局部修改，所以必须结构清晰、细节充分、中文可读。
- 能看清的文字必须逐字记录；不确定或看不清的文字写为「[看不清]」，不要编造。
- 不要评价图片好坏，不要解释你如何分析，只输出规格说明。
- 如果图片中没有文字，也要明确写“未见可读文字”。

请按以下固定结构输出：

# 图像复刻规格说明

## 1. 一句话总览
用一句话描述这张图的类型、主体、用途、整体风格。

## 2. 画布与构图锁定
说明画面比例、横竖构图、视角、镜头距离、主体位置、重心、留白、边距、层级关系、前中后景。

## 3. 主体与元素清单
逐项列出所有主要对象、装饰元素、图标、产品、人物、背景物件；说明每个元素的位置、尺寸关系、形状、姿态、遮挡关系。

## 4. 文字与排版
列出所有可读文字。对每段文字说明：原文、位置、字号层级、字重、字距、行距、对齐方式、颜色、字体气质、是否大写、是否有描边/阴影/发光/变形。

## 5. 色彩系统
描述主色、辅色、背景色、强调色、明暗关系、饱和度、对比度、渐变或色块关系。尽量给出近似色值。

## 6. 光影、材质与质感
描述光源方向、阴影软硬、反射、高光、噪点、颗粒、纸张、金属、玻璃、塑料、3D、摄影或插画质感。

## 7. 风格关键词
用逗号分隔列出 12-24 个关键词，覆盖设计风格、时代感、行业气质、摄影/插画/3D/海报类型、字体气质和渲染质感。

## 8. 必须保持不变
列出后续再生成时必须保持的内容，尤其是构图、主体、配色、光影、背景、字体气质、空间比例和细节密度。

## 9. 可局部修改区
列出最适合用户修改的文字或局部样式项，用「原内容 -> 可替换为：」格式写。没有明确文字时列出可调整的局部样式。

## 10. 最终生成提示词
写一段可直接用于图像生成的完整中文提示词。它必须强调：参考图整体保持一致，只应用用户后来修改过的内容，不改变未被修改的版式、风格和元素。${noteBlock}`.trim();
}
