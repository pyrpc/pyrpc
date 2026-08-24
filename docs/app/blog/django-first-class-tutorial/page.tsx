import Image from 'next/image'
import Link from 'next/link'

export default function DjangoFirstClassPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 Django gets first-class treatment in v0.13.0
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 23, 2026 at 4:00pm</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 Django was always supported; it was never respected. The old flow asked you to run{' '}
 <code>manage.py runserver</code> yourself while a separate watcher process regenerated types,
 and the config had no way to express &ldquo;this is where registration happens.&rdquo;
 v0.13.0 fixes all three: pyrpc dev launches <code>runserver</code> for you, the entry point is
 honestly a path to <code>manage.py</code>, and a required <code>types_module</code> names your
 registration module.
 </p>

 <Image src="/blog/django-wiring.svg" alt="Diagram: views.py declares procedures, urls.py imports views and mounts, pyrpc dev runs manage.py runserver" width={880} height={340} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The three files that matter</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# myproject/views.py, where procedures live (your types_module)
from pyrpc_core import rpc

@rpc.query
def greet(name: str = "World") -> str:
 return f"Hello, {name}!"`}</pre>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`# myproject/urls.py, wiring
from . import views # <- REQUIRED: executes the decorators
urlpatterns = [path("admin/", admin.site.urls)]
mount_django(urlpatterns) # appends POST /rpc and GET /rpc`}</pre>
 <p>
 The import in <code>urls.py</code> is not style, it is the registration mechanism. Miss
 it and <code>/rpc</code> serves an empty schema with no error anywhere.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">One command from server/</h2>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`$ cd server && pyrpc dev --yes --framework django --client ../client

 django manage.py client=../client
 ✓ pyrpc.json created (auto-configured)
 ✓ types generated (1 procs) → ../client/__pyrpc.ts
 pyRPC dev http://127.0.0.1:8000/rpc`}</pre>
 <p>
 Behind that banner, the process tree is Django&rsquo;s own:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`python manage.py runserver 127.0.0.1:8000 # cwd = manage.py's directory

# pyrpc.json
{ "backend": { "framework": "django",
 "entrypoint": "manage.py",
 "types_module": "myproject.views" } }`}</pre>
 <ul className="list-disc pl-5 space-y-2">
 <li><strong>Interactive mode</strong> asks for the manage.py path and offers the shallowest <code>*/views.py</code> as the preselected types module.</li>
 <li><strong>Omitting types_module</strong> fails loudly at startup with instructions, because guessing wrong produces an empty schema silently.</li>
 <li><strong>--noreload handling:</strong> when you run dev with reload disabled, the flag maps to runserver&rsquo;s native spelling.</li>
 </ul>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Why this fixes stale-type regen too</h2>
 <p>
 Editing <code>views.py</code> triggers codegen, which imports <code>myproject.views</code>.
 Because that import executes the decorators against a reloaded module, the router reflects
 your edit immediately, no cached-importer staleness. Under the old model (importing the
 entrypoint), <code>urls.py</code> stayed cached and its <code>from . import views</code>{' '}
 never re-ran, so edits could regenerate yesterday&rsquo;s schema with a green checkmark.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Frontend unchanged</h2>
 <p>
 Same links-based client as every other backend:
 <code>createNextClient&lt;Types&gt;&#123; links: [httpBatchLink(&#123; url &#125;)] &#125;</code>.
 Your React/Vue/Svelte/Next code cannot tell Django from FastAPI, which is the point.
 </p>
 </section>
 </article>
 )
}
