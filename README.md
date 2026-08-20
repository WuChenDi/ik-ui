<img alt="ikui - Beautiful UI components for modern React" src="https://ik-ui.pages.dev/og?title=ikui&description=Beautiful%2C%20sophisticated%20UI%20components" width="100%">

<h3 align="center">ikui</h3>

<p align="center">
  Beautiful, sophisticated UI components designed for modern React and Tailwind CSS applications —
  with first-class media, timeline, and creative-tooling primitives.
</p>

<div align="center">
  <a href="https://github.com/WuChenDi/ikui/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/WuChenDi/ikui"></a>
  <a href="https://x.com/wuchendi96"><img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/wuchendi96"></a>
  <a href="https://github.com/WuChenDi/ikui/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
  <a href="https://t.me/wuchendi"><img alt="Telegram" src="https://img.shields.io/badge/Telegram-join-blue.svg"></a>
  <a href="https://wcd.pages.dev/"><img alt="Blog" src="https://img.shields.io/badge/Blog-read-orange.svg"></a>
</div>

## Overview

**ikui** is a copy-paste React component library and documentation site. It is
distributed as a [shadcn](https://ui.shadcn.com)-style registry — you install
components straight into your codebase and own the source, rather than pulling in
an npm dependency.

Alongside the usual form and display primitives, ikui focuses on the pieces that
are hard to find elsewhere: **audio waveforms, video timelines, image editing,
and scrubbable media controls**. Everything is built on
[Base UI](https://base-ui.com) primitives (no Radix) and styled with Tailwind
CSS v4.

- **Docs & live demos** — https://ik-ui.pages.dev/docs
- **Registry** — https://ik-ui.pages.dev/r/{name}.json

## Features

- 🧩 **Copy-paste, you own the code** — installs the source into your repo via the shadcn CLI; no runtime package to lock into.
- 🎬 **Media & timeline first** — waveforms, rulers, playheads, thumbnail strips, trimmers, and a full image editor, not just buttons and inputs.
- 🧱 **Components _and_ blocks** — low-level primitives plus ready-made blocks (audio trimmer, video trimmer, media compressor, image editor…).
- 🪄 **Base UI foundation** — accessible primitives from `@base-ui/react`, re-themed with the `base-nova` style.
- 🎨 **Tailwind CSS v4** — CSS-first theming, no `tailwind.config`.
- 🤖 **AI-friendly** — MCP server, `llms.txt`, and per-page "Copy Markdown" so agents can find, install, and compose components.
- ⚛️ **Modern stack** — React 19, Next.js 16 App Router, TypeScript strict.

## Installation

ikui components are installed through the shadcn CLI. First register the ikui
namespace in your project's `components.json`:

```json
{
  "style": "base-nova",
  "registries": {
    "@ikui": "https://ik-ui.pages.dev/r/{name}.json"
  }
}
```

Then add any component or block:

```bash
npx shadcn@latest add @ikui/copy-button
npx shadcn@latest add @ikui/audio-waveform
npx shadcn@latest add @ikui/image-editor
```

> **Prerequisites:** a project on **React 19** and **Tailwind CSS v4**, set up per
> the [shadcn/ui installation guide](https://ui.shadcn.com/docs/installation).
> See the [Get Started](https://ik-ui.pages.dev/docs/get-started) guide for the
> full walkthrough.

## AI workflow

ikui is designed to be driven by AI coding tools:

- **MCP** — connect the registry as an MCP server so your IDE (Claude Code,
  Cursor, …) can search and install components for you:

  ```bash
  npx shadcn@latest mcp init
  ```

  Then ask your IDE things like _"add an audio-waveform component"_.
  See the [MCP guide](https://ik-ui.pages.dev/docs/mcp).
- **llms.txt** — a structured map of the docs for agents: [`/llms.txt`](https://ik-ui.pages.dev/llms.txt).
- **Copy Markdown** — every docs page can be copied as Markdown to feed straight into your model.

## Components

Browse the full catalog with live previews at
[ik-ui.pages.dev/docs](https://ik-ui.pages.dev/docs).

| Category  | Components |
|-----------|-----------|
| Display   | Chart · Spark Chart · QR Code · Tree · Heatmap Calendar · Data Table |
| Form      | Cascader · Password Input · Date Range Picker |
| Button    | Copy Button |
| Image     | Image Compare · Image Crop · Image Grid · Particle Image · Media Viewer |
| Audio     | Audio Waveform · Waveform Player |
| Video     | Video Thumbnail Cache · Thumbnail Strip · Segmented Timeline Strip |
| Timeline  | Timeline Ruler · Timeline Element · Timeline Playhead |
| Blocks    | Audio Trimmer · Video Trimmer · Video Audio Extractor · Media Compressor · Image Cropper · Image Editor · Storyboard Timeline · Video Frame Extractor |

## Tech stack

- **Next.js 16** (App Router, RSC) + **React 19**
- **Tailwind CSS v4** (CSS-first, no config file)
- **Base UI** (`@base-ui/react`) as the only UI primitive layer
- **MDX** docs with Shiki highlighting
- **Biome** for lint + format, **TypeScript 7** (strict), **pnpm 11**, **Node ≥ 22**

## Documentation

Visit https://ik-ui.pages.dev/docs to view the documentation.

## Contributing

You only need to change 4 files to add a new component. See the
[contributing guide](https://github.com/WuChenDi/ikui/blob/main/CONTRIBUTING.md).

## Community

Have questions, comments or feedback? Reach out on [Telegram](https://t.me/wuchendi).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=WuChenDi/ikui&type=Date)](https://www.star-history.com/#WuChenDi/ikui&Date)

## License

[MIT](./LICENSE) License © 2026-PRESENT [wudi](https://github.com/WuChenDi)

