# pyRPC × FastAPI × Next.js

Full-stack example: FastAPI backend + Next.js App Router frontend, connected by pyRPC.

Built using **official starter templates**:
- **Backend**: FastAPI [official quickstart](https://fastapi.tiangolo.com/tutorial/first-steps/) pattern
- **Frontend**: [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) with App Router

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
cd ../client && npm run dev   # Terminal 2: Next.js dev server
```

Visit: http://localhost:3000

## Project Structure

```
fastapi-nextjs/
├── server/
│   └── main.py              # FastAPI app with @rpc procedures
├── client/
│   ├── app/
│   │   ├── layout.tsx       # Next.js root layout
│   │   ├── providers.tsx    # React Query + pyRPC providers  
│   │   ├── page.tsx         # Homepage with examples
│   │   └── counter.tsx      # Interactive component
│   ├── lib/
│   │   └── pyrpc.ts         # pyRPC client setup
│   ├── package.json         # Next.js dependencies
│   └── tsconfig.json        # TypeScript config with pyRPC paths
└── README.md
```

## How It Works

1. **Backend**: FastAPI serves pyRPC endpoints at `/rpc`
2. **Type Generation**: `pyrpc dev` watches Python files and regenerates TypeScript types
3. **Frontend**: Next.js components use generated types for full type safety
4. **Queries/Mutations**: TanStack Query provides caching and state management

## Key Features Demonstrated

- End-to-end type safety from Python to TypeScript  
- Automatic type generation with `pyrpc dev`
- Server/Client Components in Next.js App Router
- TanStack Query integration for data fetching
- CORS configuration for development

## Technologies Used

**Backend:**
- FastAPI (official quickstart pattern)
- pyRPC core with FastAPI adapter
- uvicorn ASGI server

**Frontend:**
- Next.js 15 (App Router)
- React 19 with TypeScript
- TanStack Query v5
- @pyrpc/next client adapter

## Customization

To adapt this example:
1. **Modify procedures** in `server/main.py`
2. **Run `pyrpc dev`** to regenerate types
3. **Use new procedures** in React components with full type safety

## Related Examples

- [FastAPI + React](../fastapi-react/)
- [FastAPI + Vue](../fastapi-vue/) 
- [FastAPI + Svelte](../fastapi-svelte/)