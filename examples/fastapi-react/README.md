# pyRPC × FastAPI × React

Full-stack example: FastAPI backend + React frontend, connected by pyRPC.

Built using **official starter templates**:
- **Backend**: FastAPI [official quickstart](https://fastapi.tiangolo.com/tutorial/first-steps/) pattern  
- **Frontend**: [`create-react-app`](https://create-react-app.dev/docs/getting-started/) with TypeScript

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
cd ../client && npm start     # Terminal 2: React dev server
```

Visit: http://localhost:3000

## Project Structure

```
fastapi-react/
├── server/
│   └── main.py              # FastAPI app with @rpc procedures
├── client/
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   ├── pyrpc.ts         # pyRPC client setup
│   │   ├── index.tsx        # React app entry point
│   │   └── App.css          # Styling
│   ├── public/
│   │   └── index.html       # HTML template
│   ├── package.json         # React dependencies
│   └── tsconfig.json        # TypeScript config with pyRPC paths
└── README.md
```

## How It Works

1. **Backend**: FastAPI serves pyRPC endpoints at `/rpc`
2. **Type Generation**: `pyrpc dev` watches Python files and regenerates TypeScript types
3. **Frontend**: React components use generated types for full type safety
4. **State Management**: TanStack Query provides caching and state management

## Key Features Demonstrated

- End-to-end type safetyfrom Python to TypeScript  
- Automatic type generation** with `pyrpc dev`
- Create React App** structure and conventions
- @pyrpc/react** adapter with Provider pattern
- TanStack Query hooks** for data fetching
- CORS configuration** for development

## Technologies Used

**Backend:**
- FastAPI (official quickstart pattern)
- pyRPC core with FastAPI adapter
- uvicorn ASGI server

**Frontend:**
- Create React App with TypeScript
- React 18 with hooks
- TanStack Query v5
- @pyrpc/react client adapter

## Customization

To adapt this example:
1. **Modify procedures** in `server/main.py`
2. **Run `pyrpc dev`** to regenerate types
3. **Use new procedures** in React components with `api.procedure.useQuery()`

## Related Examples

- [FastAPI + Next.js](../fastapi-nextjs/)
- [FastAPI + Vue](../fastapi-vue/) 
- [FastAPI + Svelte](../fastapi-svelte/)