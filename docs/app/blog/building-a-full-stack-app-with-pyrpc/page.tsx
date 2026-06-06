import Link from 'next/link'

export default function FullStackAppPage() {
    return (
        <article className="max-w-3xl mx-auto px-6 py-20">
            <div className="mb-12">
                <Link href="/blog" className="text-[10px] font-mono uppercase tracking-[0.2em] text-fd-muted-foreground hover:text-fd-foreground transition-colors">
                    &larr; Back to Blog
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-6 mb-3">
                    Building a full-stack app with pyRPC
                </h1>
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-fd-muted-foreground">
                    <time>May 25, 2026 at 9:00am</time>
                    <span>&middot;</span>
                    <span>10 min read</span>
                </div>
            </div>

            <section className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-5 text-fd-muted-foreground [&_strong]:text-fd-foreground">
                <p>
                    In this tutorial, we'll build a complete full-stack application: a task management API with a FastAPI backend and a TypeScript React frontend  -  all connected through pyRPC with end-to-end type safety.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What we're building</h2>
                <p>
                    A simple task manager. Users can list tasks, create new ones, toggle completion status, and delete tasks. The data lives in memory (for simplicity), but the patterns are the same for any database.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 1: Set up the backend</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`mkdir pyrpc-tasks
cd pyrpc-tasks
pip install pyrpc-core[fastapi] uvicorn
mkdir server`}
                </pre>
                <p>
                    Create <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">server/app.py</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`from pyrpc_core import rpc, model
from pyrpc_fastapi import mount_fastapi
from fastapi import FastAPI
from dataclasses import dataclass
from typing import Optional

app = FastAPI()

@model
class Task:
    id: int
    title: str
    completed: bool = False

# In-memory store
_tasks: list[Task] = []
_next_id = 1

@rpc
def list_tasks() -> list[Task]:
    return list(_tasks)

@rpc
def create_task(title: str) -> Task:
    global _next_id
    task = Task(id=_next_id, title=title, completed=False)
    _tasks.append(task)
    _next_id += 1
    return task

@rpc
def toggle_task(task_id: int) -> Optional[Task]:
    for task in _tasks:
        if task.id == task_id:
            task.completed = not task.completed
            return task
    return None

@rpc
def delete_task(task_id: int) -> bool:
    global _tasks
    before = len(_tasks)
    _tasks = [t for t in _tasks if t.id != task_id]
    return len(_tasks) < before

mount_fastapi(app)`}
                </pre>
                <p>
                    Each procedure is a plain Python function with type annotations. pyRPC handles serialization, validation, and routing automatically. Start the server:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`uvicorn server.app:app --reload`}
                </pre>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 2: Generate the TypeScript types</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`pip install pyrpc-codegen
pyrpc codegen http://localhost:8000 --output ./src/types`}
                </pre>
                <p>
                    This generates the <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">@pyrpc/types</code> module with inferred types for <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">Task</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">list_tasks</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">create_task</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">toggle_task</code>, and <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">delete_task</code>.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 3: Set up the frontend</h2>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`npx create-vite@latest frontend --template react-ts
cd frontend
npm install @pyrpc/client
npm run dev`}
                </pre>
                <p>
                    Create <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">src/client.ts</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { createClient } from "@pyrpc/client"
import type { Types } from "./types"

export const client = createClient<Types>({
    url: "http://localhost:8000/pyrpc",
})`}
                </pre>
                <p>
                    Now <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client</code> is a fully typed proxy. Every procedure is available as a method with the correct parameters and return types.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Step 4: Build the UI</h2>
                <p>
                    Here's the main <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">App.tsx</code>:
                </p>
                <pre className="bg-fd-muted p-4 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`import { useEffect, useState } from "react"
import { client } from "./client"

interface Task {
    id: number
    title: string
    completed: boolean
}

export default function App() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [title, setTitle] = useState("")

    const loadTasks = async () => {
        const result = await client.list_tasks()
        setTasks(result)
    }

    useEffect(() => { loadTasks() }, [])

    const handleCreate = async () => {
        if (!title.trim()) return
        await client.create_task(title.trim())
        setTitle("")
        await loadTasks()
    }

    const handleToggle = async (id: number) => {
        await client.toggle_task(id)
        await loadTasks()
    }

    const handleDelete = async (id: number) => {
        await client.delete_task(id)
        await loadTasks()
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6">
            <h1 className="text-xl font-bold mb-4">Tasks</h1>
            <div className="flex gap-2 mb-6">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="New task..."
                    className="flex-1 border rounded px-3 py-2"
                />
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Add
                </button>
            </div>
            <ul className="space-y-2">
                {tasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggle(task.id)}
                        />
                        <span className={task.completed ? "line-through" : ""}>
                            {task.title}
                        </span>
                        <button
                            onClick={() => handleDelete(task.id)}
                            className="ml-auto text-red-500 text-sm"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}`}
                </pre>
                <p>
                    Notice that every <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.*</code> call is fully typed. If you change the return type of <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">list_tasks</code> in Python, TypeScript will flag the mismatch immediately. There's no API response to reverse-engineer, no OpenAPI spec to consult  -  the types are the truth.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">What this looks like in practice</h2>
                <p>
                    When you type <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">client.</code>, your editor shows autocomplete for all four procedures: <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">list_tasks</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">create_task</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">toggle_task</code>, <code className="text-[10px] font-mono bg-fd-muted px-1.5 py-0.5 rounded">delete_task</code>. Each one shows the expected parameters and return type. If you pass a string where a number is expected, TypeScript gives you a red squiggly line  -  before you ever run the code.
                </p>
                <p>
                    This is the same experience you'd get with tRPC on a TypeScript backend, but now your backend is Python. The type bridge works in both directions: the Python functions are validated with Pydantic, and the TypeScript client mirrors those constraints at compile time.
                </p>

                <h2 className="text-lg font-bold tracking-tight text-fd-foreground mt-10">Next steps</h2>
                <p>
                    From here, you can:
                </p>
                <ul>
                    <li>Add a database (SQLAlchemy, Prisma, etc.) behind the procedures</li>
                    <li>Add authentication with a middleware or decorator</li>
                    <li>Switch to Flask by changing one import</li>
                    <li>Deploy with Docker  -  the FastAPI app is a standard ASGI application</li>
                </ul>
                <p>
                    The full source code for this tutorial is available in the <Link href="https://github.com/pyrpc/pyrpc/tree/main/examples" className="text-fd-foreground underline underline-offset-2">examples directory</Link>.
                </p>
            </section>
        </article>
    )
}
