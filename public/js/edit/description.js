import { api } from "../shared/api-client.js";

export function buildRegenerationPrompt(description) {
  return `你将根据参考图和“已编辑图像规格说明”重新生成图片。

绝对要求：
1. 最大限度保持参考图的构图、主体位置、比例、视角、空间层级、色彩、光影、材质、字体气质、排版系统、背景和细节密度。
2. 只应用“已编辑图像规格说明”中被用户修改、替换或新增的内容。
3. 未被修改的元素必须保持原图风格和相对关系，不要重新设计版式，不要更换视觉风格，不要添加无关元素。
4. 如果说明里包含文字内容，请按说明准确生成文字，保持原图对应的字号层级、字重、字距、对齐和装饰方式。
5. 输出只需要图片，不要解释。

已编辑图像规格说明：
${description}`.trim();
}

export function createDescription({ el, state, setStatus, updateDescriptionState }) {
  function setAnalyzeLoading(on) {
    state.analyzing = on;
    el.analyzeButton.disabled = on || !state.referenceImage || state.uploading;
    el.analyzeButton.classList.toggle("is-generating", on);
    el.analyzeButton.querySelector(".primary-button__label").textContent = on ? "分析中..." : "分析图片";
  }

  async function analyzeReference() {
    if (!state.referenceImage || state.analyzing || state.uploading) return;
    setAnalyzeLoading(true);
    setStatus("正在提取构图、字体、色彩和细节...", "");
    try {
      const data = await api.describeImage({
        referenceImages: [state.referenceImage],
        userNote: el.userNote.value.trim(),
      });
      const description = String(data.description || "").trim();
      if (!description) throw new Error("模型没有返回描述文本");
      el.description.value = description;
      updateDescriptionState();
      setStatus("描述已生成，可局部修改后再生成", "");
    } catch (error) {
      setStatus(`分析失败：${error?.message || error}`, "error");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  return { analyzeReference };
}
