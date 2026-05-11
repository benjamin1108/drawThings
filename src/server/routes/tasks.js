import { readJsonBody, sendJson } from "../lib/http.js";
import { clampNumber, normalizeReferenceImages, resolveImageModel } from "../lib/validation.js";
import { createTask, getTask, resolveFinalPrompt, sendTaskImage, serializeTask } from "../services/image-service.js";
import { findStyle } from "../services/style-service.js";

export async function createImageTask(req, res) {
  const body = await readJsonBody(req, res);
  if (!body) return;
  const styleId = String(body.styleId || "").trim();
  const style = styleId ? findStyle(styleId) : null;
  if (styleId && !style) {
    sendJson(res, 400, { error: "Unknown styleId." });
    return;
  }
  const prompt = String(body.prompt || "").trim();
  const userContent = body.userContent ? String(body.userContent) : "";
  const referenceImages = normalizeReferenceImages(body.referenceImages);
  const aspect = body.aspect ? String(body.aspect) : style?.aspect || "16:9";
  const finalPrompt = resolveFinalPrompt({ body, prompt, userContent, style, aspect, referenceImages });
  if (!finalPrompt) {
    sendJson(res, 400, { error: "Prompt is required." });
    return;
  }
  const count = clampNumber(body.count, 1, 2, 2);
  const taskId = createTask({
    prompt: finalPrompt,
    count: referenceImages.length > 0 ? 1 : count,
    aspect,
    negative: body.negative ? String(body.negative) : style?.negative || undefined,
    size: body.size ? String(body.size) : undefined,
    model: resolveImageModel(body.modelMode, body.model),
    templatePrompt: body.templatePrompt ? String(body.templatePrompt) : style?.prompt || "",
    userContent,
    finalPrompt,
    referenceImages,
    styleId: style?.id,
    styleTitle: style?.title,
  });
  sendJson(res, 202, { taskId });
}

export async function getTaskImage(_req, res, { params }) {
  await sendTaskImage(res, params.taskId, Number(params.imageIndex));
}

export function getTaskStatus(_req, res, { params }) {
  const task = getTask(params.taskId);
  if (!task) {
    sendJson(res, 404, { error: "Task not found." });
    return;
  }
  sendJson(res, 200, serializeTask(task));
}
