---
name: draw-mindfree-aliyun-16x9-4k
description: Use when the user wants image generation through draw.mindfree.top in an Aliyun-style visual direction with fixed 16:9 aspect ratio, 4K output, and quality-first model selection. Also use when the request mentions 阿里云风格, 阿里橙, 16:9 横版, 4K, quality, or asks an agent to call the draw.mindfree.top image service directly.
---

# Draw Mindfree Aliyun 16:9 4K

This skill is a narrow wrapper around the `https://draw.mindfree.top` image API for one preset:

- `styleId`: `ali-orange-flat`
- `aspect`: `16:9`
- `size`: `4K`
- `modelMode`: `quality`
- preferred count: `1`

Use this skill instead of inventing prompt templates or model parameters when the user explicitly wants this preset.

The end user should not be asked to write scripts, call curl, or manually poll task status. The agent using this skill owns the full flow.

## Workflow

1. Rewrite the user's request into a short `userContent` string that describes the desired scene or communication goal.
2. Submit a task to `POST https://draw.mindfree.top/api/tasks`.
3. Poll `GET https://draw.mindfree.top/api/tasks/:taskId` until `status` becomes `completed` or `error`.
4. When completed, use the first item in `downloadUrls` to get the final image.
5. Return the final image URL or file result to the user. Do not ask the user to perform the polling or download steps.

## Request Contract

Always send JSON with this shape unless the user explicitly overrides a field:

```json
{
  "styleId": "ali-orange-flat",
  "userContent": "<user request rewritten as concise Chinese or English scene/content text>",
  "count": 1,
  "aspect": "16:9",
  "size": "4K",
  "modelMode": "quality"
}
```

Notes:

- Do not omit `aspect`, `size`, or `modelMode`. This skill exists to pin them.
- Keep `count` at `1` unless the user explicitly asks for variants.
- Do not send `prompt` when `styleId` is enough. Prefer `userContent`.
- If the user provides reference images, pass them as `referenceImages` and expect the service to force single-image output.

## Agent Request Example

The agent should internally send a request equivalent to:

```json
{
  "styleId": "ali-orange-flat",
  "userContent": "一张阿里云风格的企业级 AI 产品发布主视觉，突出云基础设施、智能编排和数据流，版面简洁，横版海报",
  "count": 1,
  "aspect": "16:9",
  "size": "4K",
  "modelMode": "quality"
}
```

Expected response:

```json
{
  "taskId": "<uuid>"
}
```

## Polling Rule

The agent should poll every 2 to 3 seconds at:

- `GET https://draw.mindfree.top/api/tasks/<taskId>`

Stop rules:

- If `status` is `completed`, return the first `downloadUrls` item as the image URL.
- If `status` is `error`, surface the `error` field and stop.
- If the user wants the binary file itself, the agent should download `https://draw.mindfree.top` plus the first `downloadUrls` path.

## Output Guidance

When using this skill on behalf of a user:

- Tell them this preset used Aliyun-style orange flat design, `16:9`, `4K`, and quality mode.
- If you created a task but did not wait for completion, return the `taskId`.
- If completed, return the final download URL.
- Do not tell the user to call the API, run curl, write a script, or manually download the image unless they explicitly ask for developer integration details.

## User-Facing Behavior

Default expectation:

- The user only describes the image they want.
- The agent performs generation on the user's behalf.
- The agent returns either the final image URL, the downloaded result, or a clear failure reason.

Preferred final response shape:

- success: final image URL
- pending: task ID and that generation is still in progress
- error: concise error reason from the API

## Guardrails

- This preset is for broad corporate, product, architecture, cloud, dashboard, and solution visuals.
- If the user wants another visual language, do not force this skill.
- If the user asks for portrait output such as `9:16`, use another workflow instead of this skill.
