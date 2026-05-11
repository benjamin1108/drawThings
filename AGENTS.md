# AGENTS.md

## 作用域

本文件作用于整个仓库。修改本仓库时优先遵守这里的规则；更深目录如有自己的 `AGENTS.md`，以更深层规则为准。

## 必读上下文

触及 CSS、前端 JS 模块、后端 route/service/lib、API 行为、架构文档时，先读：

- `ARCHITECTURE.md`：当前模块边界、目录结构、route map、CSS/JS/server 分层。
- `API.md`：公开接口行为。
- `scripts/check-architecture.mjs`：可执行的架构防腐验收线。

纯文案或小范围注释改动可不读长文档，但不得违反下面的硬约束。

## 架构硬约束

- 不要向 `src/server.js` 添加业务逻辑；它只能是兼容启动入口。
- 不要向 `public/app.js`、`public/edit.js`、`public/audit.js` 添加主实现；它们只能是兼容转发入口。
- 不要向 `public/styles.css` 添加样式；它只能是 CSS import manifest。
- CSS 新增/修改放在 `public/css/**`，遵守 token/reset/base/layout/motion/components/pages 分层。
- 前端页面入口 `public/js/*/index.js` 只做 DOM 收集、状态初始化、事件绑定和模块调用。
- 前端共享逻辑放 `public/js/shared/**`；不要重复实现 `escapeHtml`、`formatTime`、`readResponseError` 等 helper。
- 后端保持分层：`routes` 只处理 HTTP，`services` 放业务逻辑，`lib` 放 HTTP/cookie/multipart/path/validation 等底层工具。
- `requireAdmin`、cookie、safe path、multipart、sendJson 等基础能力只能有一个权威实现。
- 不要保留两套同时生效的组件样式、旧 class 或重复 token。

## TDD 规范

修 bug 或新增行为时按这个顺序：

1. 先补一个能失败的聚焦测试、smoke 步骤或架构检查。
2. 再做最小实现让它通过。
3. 先跑目标检查，再跑必要的总检查。
4. 如果暂时无法写自动化验证，必须在最终回复中说明手动验证证据和风险。

不要把“测试通过”当作唯一完成标准；实现还必须符合 `ARCHITECTURE.md` 的模块边界。

## 必跑检查

代码改动后至少运行：

```bash
npm run check
```

触及 UI、CSS、页面行为、登录/审计、路由或静态资源时，还要运行：

```bash
npm run test:smoke
```

如果检查失败，优先修复；确实无法运行时，在最终回复中说明原因。

## 变更纪律

- 优先沿用现有模式，不轻易引入新依赖。
- 改动范围要贴近任务，不做无关重构。
- 不回退用户已有改动，除非用户明确要求。
- 最终回复用中文，说明改了什么、跑了什么检查、是否有剩余风险。
