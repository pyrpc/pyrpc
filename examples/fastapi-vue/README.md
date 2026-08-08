# pyRPC × FastAPI × Vue

Full-stack example: FastAPI backend + Vue frontend, connected by pyRPC.

Built using **official starter templates**:
- **Backend**: FastAPI [official quickstart](https://fastapi.tiangolo.com/tutorial/first-steps/) pattern  
- **Frontend**: [Vite + Vue 3](https://vuejs.org/guide/scaling-up/tooling.html#vite) with Composition API

## Quick Start

```bash
# 1. Install Python dependencies
cd server
pip install pyrpc-core[fastapi]

# 2. Install frontend dependencies  
cd ../client
npm install

# 3. Start development (2 terminals)
cd ../server && pyrpc dev     # Terminal 1: FastAPI + type generation
cd ../client && npm run dev   # Terminal 2: Vite dev server
```

Visit: http://localhost:5173

## Project Structure

```
fastapi-vue/
├── server/
│   └── main.py              # FastAPI app with @rpc procedures
├── client/
│   ├── src/
│   │   ├── App.vue          # Main Vue component
│   │   ├── pyrpc.ts         # pyRPC client setup
│   │   ├── main.ts          # Vue app entry point
│   │   └── style.css        # Global styles
│   ├── index.html           # HTML template
│   ├── package.json         # Vue + Vite dependencies
│   ├── tsconfig.json        # TypeScript config with pyRPC paths
│   └── vite.config.ts       # Vite configuration
└── README.md
```

## How It Works

1. **Backend**: FastAPI serves pyRPC endpoints at `/rpc`
2. **Type Generation**: `pyrpc dev` watches Python files and regenerates TypeScript types
3. **Frontend**: Vue 3 components use generated types with Composition API
4. **State Management**: TanStack Vue Query provides reactive data fetching

## Key Features Demonstrated

- End-to-end type safetyfrom Python to TypeScript  
- Automatic type generation** with `pyrpc dev`
- Vue 3 Composition API** with `<script setup>`
- @pyrpc/vue** adapter with plugin pattern
- TanStack Vue Query** for reactive data
- Vite** for fast development and building

## Technologies Used

**Backend:**
- FastAPI (official quickstart pattern)
- pyRPC core with FastAPI adapter
- uvicorn ASGI server

**Frontend:**
- Vue 3 with Composition API
- Vite for build tooling
- TanStack Vue Query v5
- @pyrpc/vue client adapter

## Customization

To adapt this example:
1. **Modify procedures** in `server/main.py`
2. **Run `pyrpc dev`** to regenerate types
3. **Use new procedures** in Vue components with `pyrpc.procedure.createQuery()`

## Related Examples

- [FastAPI + Next.js](../fastapi-nextjs/)
- [FastAPI + React](../fastapi-react/) 
- [FastAPI + Svelte](../fastapi-svelte/)