import Link from 'next/link'

export default function RegistryMergeAndNamespacesPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Router.merge: how pyRPC handles namespaces
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>July 27, 2026 at 6:15am</time>
                    <span>&middot;</span>
                    <span>8 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    When your project grows past ten procedures, a single flat router becomes hard to navigate. pyRPC's <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router.merge()</code> lets you split procedures into separate modules and combine them at the top level.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The basic pattern</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# users.py
from pyrpc_core import Router

users = Router()

@users.rpc
def get_user(user_id: int) -> dict: ...

@users.rpc
def update_user(user_id: int, name: str) -> dict: ...

# orders.py
from pyrpc_core import Router

orders = Router()

@orders.rpc
def get_order(order_id: int) -> dict: ...

# app.py
from pyrpc_core import Router
from users import users
from orders import orders

router = Router()
router.merge(users)
router.merge(orders)`}
                </pre>
                <p>
                    Each module gets its own <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router</code>. The main app merges them. The framework adapter sees one flat namespace of procedures.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">With prefixes</h2>
                <p>
                    <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">merge()</code> accepts an optional <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prefix</code> parameter. Procedures become <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">prefix.procedure_name</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`router.merge(users, prefix="users")
router.merge(orders, prefix="orders")`}
                </pre>
                <p>
                    On the TypeScript side, you get <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.users.get_user.useQuery()</code> and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.orders.get_order.useQuery()</code>. Without prefixes, it is just <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">api.get_user.useQuery()</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this matters</h2>
                <p>
                    Larger projects need separation. One team owns users, another owns orders. Each team writes their own <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Router</code>. The main app merges them. No circular imports, no shared state, no framework-specific routing.
                </p>
                <p>
                    This is the same pattern tRPC uses with nested routers, but pyRPC keeps it simpler: flat merge, optional prefix, one level. If you need deeper nesting, just merge a merged router.
                </p>

                <p>
                    <Link href="/docs/server/procedures" className="text-fd-foreground underline underline-offset-2">Procedures docs</Link> · <Link href="/blog/framework-adapters-deep-dive" className="text-fd-foreground underline underline-offset-2">Adapters deep dive</Link>
                </p>
            </section>
        </article>
    )
}
