# pyRPC Examples

This directory contains comprehensive full-stack examples demonstrating pyRPC with all major Python backend and JavaScript frontend framework combinations.

## Architecture

Each example follows a consistent structure with **server/client separation**:

```
framework-combination/
├── server/          # Backend implementation
├── client/          # Frontend implementation  
└── README.md        # Setup and usage instructions
```

## Available Examples

### FastAPI Backend

| Frontend | Directory | Description |
|----------|-----------|-------------|
| **Next.js** | [`fastapi-nextjs/`](./fastapi-nextjs/) | FastAPI + Next.js App Router + TanStack Query |
| **React** | [`fastapi-react/`](./fastapi-react/) | FastAPI + Create React App + TanStack Query |
| **Vue** | [`fastapi-vue/`](./fastapi-vue/) | FastAPI + Vue 3 + Vite + TanStack Query |
| **Svelte** | [`fastapi-svelte/`](./fastapi-svelte/) | FastAPI + SvelteKit + TanStack Query |

### Flask Backend

| Frontend | Directory | Description |
|----------|-----------|-------------|
| **Next.js** | [`flask-nextjs/`](./flask-nextjs/) | Flask + Next.js App Router + TanStack Query |
| **React** | [`flask-react/`](./flask-react/) | Flask + Create React App + TanStack Query |
| **Vue** | [`flask-vue/`](./flask-vue/) | Flask + Vue 3 + Vite + TanStack Query |
| **Svelte** | [`flask-svelte/`](./flask-svelte/) | Flask + SvelteKit + TanStack Query |

### Django Backend

| Frontend | Directory | Description |
|----------|-----------|-------------|
| **Next.js** | [`django-nextjs/`](./django-nextjs/) | Django + Next.js App Router + TanStack Query |
| **React** | [`django-react/`](./django-react/) | Django + Create React App + TanStack Query |
| **Vue** | [`django-vue/`](./django-vue/) | Django + Vue 3 + Vite + TanStack Query |
| **Svelte** | [`django-svelte/`](./django-svelte/) | Django + SvelteKit + TanStack Query |

## Prerequisites

- **Python 3.11+** (with pip or uv)
- **Node.js 20+** (with npm)

## Quick Start

1. **Choose an example** from the table above
2. **Navigate to the directory**: `cd fastapi-nextjs` (or your choice)
3. **Follow the README** in that directory for specific setup

## Framework Standards

All examples are built using **official starter templates**:

### Backend Standards
- **FastAPI**: Official quickstart pattern from FastAPI docs
- **Flask**: Official tutorial structure from Flask docs  
- **Django**: Standard Django project layout from Django tutorial

### Frontend Standards
- **Next.js**: `create-next-app` with App Router
- **React**: `create-react-app` with TypeScript
- **Vue**: Vite + Vue 3 with Composition API
- **Svelte**: SvelteKit with TypeScript

## Common Development Workflow

Each example follows the same development pattern:

```bash
# Terminal 1: Start backend with type generation
cd server
pyrpc dev

# Terminal 2: Start frontend dev server  
cd client
npm run dev
```

## What Each Example Demonstrates

- **End-to-end type safety** from Python to TypeScript
- **Automatic type generation** via `pyrpc dev`
- **Query/Mutation patterns** with TanStack Query
- **CORS configuration** for development
- **Framework-specific patterns** and best practices
- **Official project structures** for each framework

## Contributing

When adding new examples:
1. Follow the official starter template for each framework
2. Use the consistent server/client directory structure
3. Include comprehensive README with setup instructions
4. Demonstrate the same core pyRPC features across examples

## Learn More

- [pyRPC Documentation](https://pyrpc.dev)
- [pyRPC GitHub](https://github.com/pyrpc/pyrpc)
- [Tutorial: Building a Full-Stack App](https://pyrpc.dev/blog/building-a-full-stack-app-with-pyrpc)