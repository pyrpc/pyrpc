"use client";

const MCP_CLIENTS = [
  { name: "Claude", icon: "https://cdn.simpleicons.org/anthropic" },
  { name: "Cursor", icon: "https://cdn.simpleicons.org/cursor" },
  { name: "VS Code", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" },
  { name: "Windsurf", icon: "https://cdn.simpleicons.org/windsurf" },
  { name: "Cline", icon: "https://cdn.simpleicons.org/cline" },
  { name: "Zed", icon: "https://cdn.simpleicons.org/zedindustries" },
  { name: "Codex", icon: "https://cdn.simpleicons.org/openai" },
  { name: "Grok", icon: "https://cdn.simpleicons.org/x" },
  { name: "Antigravity", icon: "https://cdn.simpleicons.org/googlegemini" },
  { name: "OpenCode", icon: "https://cdn.simpleicons.org/opencode" },
];

const doubled = [...MCP_CLIENTS, ...MCP_CLIENTS];

export default function McpClientsBar() {
  return (
    <div className="w-full overflow-hidden border-b border-neutral-200 dark:border-white/[0.1]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10 py-8 md:py-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 text-center mb-6">
          Connect MCP clients to pyRPC
        </p>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          {/* Scrolling track */}
          <div className="flex w-max animate-[scroll-left_40s_linear_infinite]">
            {doubled.map((client, i) => (
              <div
                key={`${client.name}-${i}`}
                className="flex items-center gap-2 mx-6 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:opacity-60 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={client.icon}
                  alt={client.name}
                  className="h-4 w-auto object-contain brightness-0 dark:invert md:h-5"
                />
                <span className="font-sans text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {client.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
