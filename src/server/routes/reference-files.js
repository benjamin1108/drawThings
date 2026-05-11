import { uploadFile } from "../../gemini-client.js";
import { sendJson } from "../lib/http.js";
import { readMultipartImage } from "../lib/multipart.js";
import { persistUploadedReferenceToDisk } from "../services/file-store.js";

export async function uploadReferenceFile(req, res) {
  const file = await readMultipartImage(req, res);
  if (!file) return;
  const saved = await persistUploadedReferenceToDisk(file.data, file.mimeType, file.filename);
  const uploaded = await uploadFile({
    data: file.data,
    mimeType: file.mimeType,
    displayName: file.filename,
  });
  sendJson(res, 200, {
    referenceImage: {
      mimeType: uploaded.mimeType || file.mimeType,
      fileUri: uploaded.uri,
      name: uploaded.name,
      displayName: uploaded.displayName || file.filename,
      sizeBytes: uploaded.sizeBytes,
      state: uploaded.state,
      localPath: saved.path,
      bytes: saved.bytes,
      sha256: saved.sha256,
    },
  });
}
