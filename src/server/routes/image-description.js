import { generateText } from "../../gemini-client.js";
import { readJsonBody, sendJson } from "../lib/http.js";
import { normalizeReferenceImages } from "../lib/validation.js";
import { buildImageDescriptionPrompt } from "../services/image-service.js";

const imageDescriptionModel = "gemini-3.1-pro-preview";

export async function describeImage(req, res) {
  const body = await readJsonBody(req, res);
  if (!body) return;
  const referenceImages = normalizeReferenceImages(body.referenceImages).slice(0, 1);
  if (!referenceImages.length) {
    sendJson(res, 400, { error: "Reference image is required." });
    return;
  }
  const description = await generateText({
    prompt: buildImageDescriptionPrompt(body.userNote ? String(body.userNote) : ""),
    model: imageDescriptionModel,
    referenceImages,
  });
  sendJson(res, 200, { description, model: imageDescriptionModel });
}
