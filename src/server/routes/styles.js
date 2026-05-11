import { sendJson } from "../lib/http.js";
import { findStyle, listStyles, styleForApi } from "../services/style-service.js";

export function getStyles(_req, res) {
  sendJson(res, 200, { styles: listStyles() });
}

export function getStyle(_req, res, { params }) {
  const style = findStyle(params.styleId);
  if (!style) {
    sendJson(res, 404, { error: "Style not found." });
    return;
  }
  sendJson(res, 200, styleForApi(style));
}
