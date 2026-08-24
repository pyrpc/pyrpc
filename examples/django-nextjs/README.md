# pyRPC × Django × Next.js

Full-stack example: Django backend + Next.js App Router frontend, connected by pyRPC.

Built using **official starter templates**:
- **Backend**: Django [official tutorial](https://docs.djangoproject.com/en/stable/intro/tutorial01/) structure
- **Frontend**: [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) with App Router

## Quick Start

```bash
# 1. Install Python dependencies
cd server
pip install "pyrpc-core[django]" django-cors-headers

# 2. Install frontend dependencies  
cd ../client
npm install

# 3. Start development (2 terminals)
cd ../server && pyrpc dev                                 # Terminal 1: Django on :8000 + type generation
cd ../client && npm run dev                               # Terminal 2: Next.js dev server
```

Visit: http://localhost:3000

## Project Structure

```
django-nextjs/
├── server/
│   ├── manage.py            # Django management script
│   └── myproject/
│       ├── __init__.py      # Django project init
│       ├── settings.py      # Django settings with CORS
│       ├── urls.py          # URL routing with pyRPC
│       ├── views.py         # Django views with @rpc procedures
│       └── wsgi.py          # WSGI application
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

1. **Backend**: `pyrpc dev` launches Django's own dev server (`manage.py runserver`) and serves pyRPC endpoints at `/rpc`
2. **Type Generation**: the same command imports your views module (the configured `types_module`) and regenerates TypeScript types on every `.py` save
3. **Frontend**: Next.js components use generated types for full type safety
4. **Queries/Mutations**: TanStack Query provides caching and state management

## Key Features Demonstrated

- End-to-end type safety from Python to TypeScript
- Automatic type generation with `pyrpc dev`
- Django project structure following official tutorial
- Async views with pyRPC procedures
- TanStack Query integration for data fetching
- CORS configuration for development

## Technologies Used

**Backend:**
- Django (official tutorial structure)
- pyRPC core with Django adapter
- django-cors-headers for development

**Frontend:**
- Next.js 15 (App Router)
- React 19 with TypeScript
- TanStack Query v5
- @pyrpc/next client adapter

## Customization

To adapt this example:
1. **Modify procedures** in `server/myproject/views.py`
2. **Run `pyrpc watch`** to regenerate types
3. **Use new procedures** in React components with full type safety

## Related Examples

- [Django + React](../django-react/)
- [Django + Vue](../django-vue/) 
- [Django + Svelte](../django-svelte/)