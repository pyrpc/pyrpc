import { Counter } from "./counter";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          pyRPC × Flask × Next.js
        </h1>
        <p className="text-center mb-8">
          Full-stack type safety with Flask backend and Next.js frontend
        </p>
        
        <div className="border rounded-lg p-8">
          <Counter />
        </div>
      </div>
    </main>
  );
}
