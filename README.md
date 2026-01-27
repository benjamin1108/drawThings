# Gemini Image Generation Tool

Simple CLI tool for generating images using the Gemini Image Generation API.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` and set your API key:

```bash
cp .env.example .env
```

## Usage

```bash
node src/generate-image.js "A futuristic city at sunrise"
```

## UI

Start the local UI server and open the URL it prints:

```bash
npm run ui
```

Options:
- `--out <file>` output path (default `output.png`)
- `--count <n>` number of images
- `--aspect <ratio>` aspect ratio like `1:1`, `4:3`, `16:9`
- `--size <size>` image size like `1K`, `2K`, `4K` (Gemini 3 Pro only)
- `--negative <text>` negative prompt
- `--model <id>` override model id

Example:

```bash
node src/generate-image.js "Modern watercolor landscape" --count 2 --out art.png
```
