import Image from 'next/image'
import Link from 'next/link'

export default function TypesModuleContractPost() {
 return (
 <article className="max-w-3xl mx-auto px-6 py-20">
 <div className="mb-12">
 <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
 &larr; Back to Blog
 </Link>
 <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
 The types_module contract: registration is an import side effect
 </h1>
 <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
 <time>August 22, 2026 at 1:00pm</time>
 <span>&middot;</span>
 <span>8 min read</span>
 </div>
 </div>

 <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
 <p>
 pyRPC has no registration list. No plugin discovery, no directory scan, no decorators collected
 into a manifest. There is exactly one mechanism: importing a module executes its{' '}
 <code>@rpc</code> decorators, which insert procedures into the router singleton. Every codegen
 feature rests on this sentence, and v0.13.0 makes you name that module explicitly.
 </p>

 <Image src="/blog/types-module-chain.svg" alt="Diagram: @rpc decorators fire during import, populating default_router, which feeds the schema endpoint and codegen" width={880} height={400} className="my-4 w-full h-auto rounded-lg border border-[#26262b]" />

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The failure mode that forced the contract</h2>
 <p>
 Consider the standard Django layout: procedures declared in <code>views.py</code>, wired in{' '}
 <code>urls.py</code>. If your configured module was the entrypoint, the watcher would import{' '}
 <code>urls.py</code>... or think it did. Here is the trap the old flow contained:
 </p>
 <ul className="list-disc pl-5 space-y-2">
 <li><code>reload_module</code> restores the edited module&rsquo;s bytecode but <strong>does not re-execute its importers</strong>.</li>
 <li><code>urls.py</code> stays cached in <code>sys.modules</code>; its top-level <code>from . import views</code> does not run again.</li>
 <li>The decorators never re-fire. The router keeps whatever was registered before your edit.</li>
 <li>Regenerated types are stale, silently, with a green checkmark.</li>
 </ul>
 <p>
 For FastAPI single-file apps the entrypoint <em>is</em> the registration module, so the bug hid.
 Split-module layouts exposed it. The fix is not cleverer reloading machinery, it is{' '}
 <strong>naming the module whose import registers everything</strong>, and importing exactly that:
 </p>
 <pre className="bg-fd-muted/30 p-4 rounded-lg text-xs overflow-x-auto">{`// pyrpc.json, django layout
{ "backend": {
 "framework": "django",
 "entrypoint": "manage.py",
 "types_module": "myproject.views" // <- the file with @rpc
} }`}</pre>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Defaults that fail loudly</h2>
 <p>
 For fastapi/flask/asgi, <code>types_module</code> defaults to the module part of{' '}
 <code>entrypoint</code>, usually right, because those files typically call{' '}
 <code>mount_*(app)</code> themselves. For Django there is no honest default ({' '}
 <code>settings.py</code> registers nothing; guessing <code>views</code> paths is how silent
 emptiness happens), so the contract requires it: omit it and resolution fails with a message
 telling you what to name. The wizard auto-detects the shallowest{' '}
 <code>*/views.py</code> under the project and offers it preselected.
 </p>

 <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">The general shape of the lesson</h2>
 <p>
 Import-side-effect systems are compact and delightful until someone asks &ldquo;which import?&rdquo;
 At that moment the honest answers are only ever: <strong>a named module</strong> or{' '}
 <strong>a real registry</strong>. We picked naming, one string in one JSON file, 
 because it composes with reload semantics instead of fighting them, and because the failure
 mode of naming wrong (empty schema, loud) beats the failure mode of scanning wrong (partial
 schema, quiet).
 </p>
 <p>
 If you remember one line from this post: <strong>codegen reflects what imported, not what exists.</strong>{' '}
 Point the name at the file where your procedures live.
 </p>
 </section>
 </article>
 )
}
