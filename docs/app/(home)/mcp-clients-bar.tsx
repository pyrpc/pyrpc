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

const LogosList = () => (
  <ul className="m-0 flex shrink-0 items-center gap-10 p-0 px-10">
    {MCP_CLIENTS.map((client) => (
      <li key={client.name} className="m-0 flex list-none items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={client.icon}
          alt={client.name}
          className="h-5 w-auto object-contain brightness-0 opacity-40 dark:invert dark:opacity-50 lg:h-[18px] md:h-4"
        />
        <span className="font-sans text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {client.name}
        </span>
      </li>
    ))}
  </ul>
);

export default function McpClientsBar() {
  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto flex max-w-[1200px] items-center gap-11 px-6 pt-12 pb-4 md:px-10 md:pt-16 md:pb-6 lg:gap-[14px]">
        <p className="w-[146px] shrink-0 text-[15px] font-medium leading-snug tracking-extra-tight text-neutral-500 dark:text-neutral-400 lg:w-32">
          Connect MCP clients to pyRPC:
        </p>
        <div className="relative mx-auto w-full min-w-0 overflow-hidden lg:max-w-none lg:px-8 md:px-5">
          <div className="flex w-max animate-[scroll-logos_30s_linear_infinite] hover:[animation-play-state:paused]">
            <LogosList />
            <LogosList />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scroll-logos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
