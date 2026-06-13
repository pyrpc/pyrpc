import Link from 'next/link'

export default function V073DjangoAdapterPost() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    v0.7.3 - Django adapter, FastAPI/Flask fixes
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>June 13, 2026 at 8:00am</time>
                    <span>&middot;</span>
                    <span>4 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    v0.7.3 adds the third framework adapter &mdash; Django &mdash; alongside
                    the existing FastAPI and Flask adapters. It also fixes a crash in
                    <code>get_registry_schema()</code> that affected FastAPI and Flask
                    when no explicit router was provided.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The Django adapter
                </h2>
                <p>
                    The adapter is a new package: <code>pyrpc-django-adapter</code>.
                    It exposes a <code>mount_django()</code> function similar to
                    <code>mount_fastapi()</code> and <code>mount_flask()</code>,
                    but tailored for Django's URL routing system:
                </p>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# app/views.py
from pyrpc_core import rpc

@rpc
def add(a: int, b: int) -> int:
    return a + b`}</pre>
                <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# app/urls.py
from django.urls import path
from pyrpc_django import mount_django

urlpatterns = [
    *mount_django(),
]`}</pre>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
                    Native async views
                </h3>
                <p>
                    Unlike the Flask adapter (which uses <code>anyio.run</code> to bridge
                    sync and async), Django supports <code>async def</code> views natively
                    since Django 3.1. The adapter takes advantage of this &mdash; no extra
                    runtime overhead, no thread-pool bridges, just direct async dispatch.
                </p>

                <h3 className="text-base font-bold tracking-tight text-fd-foreground mt-8">
                    Name collision on PyPI
                </h3>
                <p>
                    The original name <code>pyrpc-django</code> was already taken by an
                    unrelated project from 2020. We renamed to
                    <code>pyrpc-django-adapter</code>, which is available and follows
                    the same naming pattern as <code>pyrpc-fastapi</code> and
                    <code>pyrpc-flask</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    The introspection bug
                </h2>
                <p>
                    While building the Django adapter, we discovered that all three
                    adapters had the same latent bug: when no <code>router</code>
                    argument was passed to <code>mount_fastapi()</code> or
                    <code>mount_flask()</code>, the introspection endpoint
                    (<code>GET /rpc</code>) called
                    <code>get_registry_schema(router=None)</code>, which crashed with
                    <code>AttributeError: 'NoneType' object has no attribute '_procedures'</code>.
                </p>
                <p>
                    The fix is consistent across all three adapters: resolve
                    <code>router or default_router</code> at the top of each mount function,
                    before any endpoint is registered. The Django adapter was built with
                    this pattern from the start; FastAPI and Flask were patched after.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">
                    What&rsquo;s next
                </h2>
                <p>
                    This rounds out the initial adapter coverage for the major Python
                    web frameworks. Future work includes performance benchmarks across
                    all three adapters, a middleware API for pyRPC, and more documentation
                    for advanced patterns.
                </p>
                <p>
                    Read the full
                    <Link href="/changelog" className="text-fd-foreground underline"> changelog</Link>
                    for the complete list of changes.
                </p>
            </section>
        </article>
    )
}
