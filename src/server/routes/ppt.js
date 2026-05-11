import { readJsonBody, sendJson } from "../lib/http.js";
import { resolveImageModel } from "../lib/validation.js";
import { createPptTask } from "../services/image-service.js";
import { findStyle } from "../services/style-service.js";

export async function createPpt(req, res) {
  const body = await readJsonBody(req, res);
  if (!body) return;
  const userContent = String(body.userContent || "").trim();
  if (!userContent) {
    sendJson(res, 400, { error: "User content is required." });
    return;
  }
  const styleId = String(body.styleId || "").trim();
  const style = styleId ? findStyle(styleId) : null;
  if (styleId && !style) {
    sendJson(res, 400, { error: "Unknown styleId." });
    return;
  }
  const taskId = createPptTask({
    userContent,
    aspect: body.aspect ? String(body.aspect) : style?.aspect || "16:9",
    size: body.size ? String(body.size) : undefined,
    negative: body.negative ? String(body.negative) : style?.negative || undefined,
    templatePrompt: body.templatePrompt ? String(body.templatePrompt) : style?.prompt || "",
    stylePrompt: body.stylePrompt ? String(body.stylePrompt) : style?.prompt || "",
    styleTitle: body.styleTitle ? String(body.styleTitle) : style?.title || "",
    styleId: style?.id,
    model: resolveImageModel(body.modelMode, body.model),
  });
  sendJson(res, 202, { taskId });
}
