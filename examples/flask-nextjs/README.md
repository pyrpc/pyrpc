# pyRPC × Flask × Next.js

Full-stack example: Flask backend + Next.js App Router frontend, connected by pyRPC.

Built using **official starter templates**:
- **Backend**: Flask [official quickstart](https://flask.palletsprojects.com/en/stable/quickstart/) pattern
- **Frontend**: [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) with App Router

## Quick Start

```bash
# 1. Install Python dependencies
cd server
pip install "pyrpc-core[flask]" flask-cors

# 2. Install frontend dependencies  
cd ../client
npm install

# 3. Start development (2 terminals)
cd ../server && pyrpc dev                                     # Terminal 1: Flask on :8000 + type generation
cd ../client && npm run dev                                   # Terminal 2: Next.js dev server
```

Visit: http://localhost:3000

## Project Structure

```
flask-nextjs/
├── server/
│   └── main.py              # Flask app with @rpc procedures
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

1. **Backend**: `pyrpc dev` launches Flask's native dev server (`flask run`) and serves pyRPC endpoints at `/rpc`
2. **Type Generation**: the same command watches Python files and regenerates TypeScript types
3. **Frontend**: Next.js components use generated types for full type safety
4. **Queries/Mutations**: TanStack Query provides caching and state management

## Key Features Demonstrated

- End-to-end type safety from Python to TypeScript
- Automatic type generation with `pyrpc watch`
- Server/Client Components in Next.js App Router
- TanStack Query integration for data fetching
- CORS configuration for development

## Technologies Used

**Backend:**
- Flask (official quickstart pattern)
- pyRPC core with Flask adapter
- Flask-CORS for development

**Frontend:**
- Next.js 15 (App Router)
- React 19 with TypeScript
- TanStack Query v5
- @pyrpc/next client adapter

## Customization

To adapt this example:
1. **Modify procedures** in `server/main.py`
2. **Run `pyrpc watch`** to regenerate types
3. **Use new procedures** in React components with full type safety

## Related Examples

- [Flask + React](../flask-react/)
- [Flask + Vue](../flask-vue/) 
- [Flask + Svelte](../flask-svelte/)