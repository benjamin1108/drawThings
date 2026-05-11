import { formatBytes } from "../shared/format.js";
import { revokeObjectUrl, createObjectUrl } from "../shared/media.js";

export function createUpload({ el, state, setStatus, updateDescriptionState }) {
  function setUploadProgress(percent, label) {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    el.uploadProgressFill.style.width = `${value}%`;
    el.uploadProgressValue.textContent = `${value}%`;
    el.uploadProgressLabel.textContent = label || "上传中";
  }

  function setUploadLoading(on) {
    state.uploading = on;
    el.analyzeButton.disabled = on || !state.referenceImage;
    el.clearReference.disabled = on || !state.referenceImage;
    el.dropzone.classList.toggle("is-uploading", on);
    if (on) {
      setUploadProgress(4, "准备上传");
      el.uploadProgress.hidden = false;
    }
    updateDescriptionState();
  }

  async function uploadReferenceFile(file) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("image", file, file.name || "reference-image");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/reference-files");
      xhr.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) {
          setUploadProgress(18, "正在上传到服务端");
          return;
        }
        const clientPercent = Math.round((event.loaded / event.total) * 68);
        setUploadProgress(Math.max(8, Math.min(clientPercent, 68)), "正在上传到服务端");
      });
      xhr.upload.addEventListener("load", () => setUploadProgress(76, "正在写入 Google Files API"));
      xhr.addEventListener("load", () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(readXhrErrorMessage(xhr)));
          return;
        }
        try {
          const referenceImage = JSON.parse(xhr.responseText || "{}").referenceImage;
          if (!referenceImage?.fileUri || !referenceImage?.mimeType) {
            reject(new Error("文件上传没有返回 Gemini fileUri"));
            return;
          }
          setUploadProgress(100, "Google Files API 上传完成");
          resolve(referenceImage);
        } catch {
          reject(new Error("文件上传响应格式不正确"));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("上传请求失败")));
      xhr.addEventListener("timeout", () => reject(new Error("上传超时")));
      xhr.send(formData);
    });
  }

  function readXhrErrorMessage(xhr) {
    if (xhr.status === 413) {
      return "图片超过服务器上传限制。当前已改为 Files API，但文件仍需先经过本服务；请调高 nginx client_max_body_size 或上传更小文件。";
    }
    try {
      const parsed = JSON.parse(xhr.responseText || "{}");
      return parsed?.error || xhr.responseText || xhr.statusText;
    } catch {
      return xhr.responseText || xhr.statusText;
    }
  }

  async function loadReferenceFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("请选择图片文件。", "error");
      return;
    }
    clearReference({ silent: true });
    state.previewUrl = createObjectUrl(file);
    el.referenceImage.src = state.previewUrl;
    el.referencePreview.hidden = false;
    el.zoomReference.disabled = false;
    el.dropzone.classList.add("has-file");
    el.referenceMeta.textContent = `${file.name || "clipboard-image"} · ${formatBytes(file.size)} · 上传中`;
    setUploadLoading(true);
    setStatus("正在上传到 Gemini Files API...", "");
    try {
      state.referenceImage = await uploadReferenceFile(file);
      el.referenceMeta.textContent = `${file.name || "clipboard-image"} · ${formatBytes(file.size)} · Files API`;
      setStatus("参考图已上传，后续分析和生成将使用 fileUri", "");
      window.setTimeout(() => {
        if (!state.uploading && state.referenceImage) el.uploadProgress.hidden = true;
      }, 900);
    } catch (error) {
      clearReference({ silent: true });
      el.uploadProgress.hidden = true;
      setStatus(`上传失败：${error?.message || error}`, "error");
    } finally {
      setUploadLoading(false);
    }
  }

  function clearReference(options = {}) {
    state.referenceImage = null;
    revokeObjectUrl(state.previewUrl);
    state.previewUrl = null;
    el.imageInput.value = "";
    el.referenceImage.removeAttribute("src");
    el.referencePreview.hidden = true;
    el.referenceMeta.textContent = "";
    el.uploadProgress.hidden = true;
    setUploadProgress(0, "准备上传");
    el.zoomReference.disabled = true;
    el.clearReference.disabled = true;
    el.analyzeButton.disabled = true;
    el.dropzone.classList.remove("has-file", "is-uploading");
    if (!options.silent) setStatus("等待参考图", "");
    updateDescriptionState();
  }

  function bindUpload() {
    el.dropzone.addEventListener("click", () => el.imageInput.click());
    el.imageInput.addEventListener("change", () => {
      loadReferenceFile(el.imageInput.files?.[0]).catch((error) => {
        setStatus(`读取失败：${error?.message || error}`, "error");
      });
    });
    el.clearReference.addEventListener("click", clearReference);

    ["dragenter", "dragover"].forEach((eventName) => {
      el.dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        el.dropzone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      el.dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        el.dropzone.classList.remove("is-dragging");
      });
    });
    el.dropzone.addEventListener("drop", (event) => {
      loadReferenceFile(event.dataTransfer?.files?.[0]).catch((error) => {
        setStatus(`读取失败：${error?.message || error}`, "error");
      });
    });
    document.addEventListener("paste", (event) => {
      const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
      if (!item) return;
      loadReferenceFile(item.getAsFile()).catch((error) => {
        setStatus(`读取失败：${error?.message || error}`, "error");
      });
    });
  }

  return { bindUpload, clearReference };
}
