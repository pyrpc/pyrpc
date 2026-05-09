<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/branding/png/pyrpc-wordmark-bg-dark.png" />
  <source media="(prefers-color-scheme: light)" srcset="public/branding/png/pyrpc-wordmark-bg-light.png" />
  <img alt="pyRPC" src="public/branding/png/pyrpc-wordmark-bg-light.png" width="220" />
</picture>

### Website & Docs

The main website and documentation for [pyrpc.io](https://pyrpc.io)

[![Website](https://img.shields.io/badge/pyrpc.io-000?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA2MCA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTAgMEgxNVYxNUgzMFYzMEgxNVY0NUgwVjMwVjE1VjBaTTQ1IDMwVjE1SDMwVjBINDVINjBWMTVWMzBWNDVINDVIMzBWMzBINDVaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==&logoColor=white)](https://pyrpc.io)
[![GitHub Stars](https://img.shields.io/github/stars/pyrpc/pyrpc?style=flat&logo=github&label=stars&color=24292e)](https://github.com/pyrpc/pyrpc)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat)](LICENSE)

***

## Quick Start

```bash
# install
npm install

# develop
npm run dev
```

Open **[localhost:3000](http://localhost:3000)** to preview.

## Stack

* **Framework**: Next.js 16 (App Router, Turbopack)
* **Styling**: Tailwind CSS 4
* **Animation**: Framer Motion
* **Docs**: Fumadocs
* **Icons**: Lucide React
* **Fonts**: Geist Sans & Geist Mono

## Structure

```
├─ app/
│  ├─ (home)/               # Home — hero + demo
│  ├─ demo/                 # Interactive Playground
│  └─ docs/[[...slug]]/     # Documentation (MDX)
│
├─ components/
│  ├─ landing/              # Marketing components
│  ├─ playground/           # Interactive playground components
│  ├─ ui/                   # Shared primitives
│  └─ docs/                 # Documentation components
│
├─ content/                 # MDX documentation files
│
├─ lib/
│  ├─ source.ts             # Fumadocs content source
│  └─ utils.ts              # Utilities
│
└─ public/
   └─ branding/             # Logo assets (PNG)
```

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
```
