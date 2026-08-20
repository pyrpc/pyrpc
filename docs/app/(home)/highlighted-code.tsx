import { highlight } from "fumadocs-core/highlight";
import type { HighlightOptions } from "fumadocs-core/highlight";
import type { ReactNode } from "react";

import { shikiHighlightOptions } from "@/lib/shiki-themes";

function createPre() {
  return function Pre(props: Record<string, unknown>) {
    const { children, className, style, ...rest } = props as {
      children?: ReactNode;
      className?: string;
      style?: Record<string, string>;
    };
    return (
      <pre
        {...rest}
        className={className}
        style={{
          ...style,
          fontFamily: '"Geist Mono", monospace',
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "20px",
          padding: 0,
          margin: 0,
          background: "transparent",
        }}
      >
        {children}
      </pre>
    );
  };
}

const serverCode = `from pyrpc_core import rpc, model

@model
class Team:
    id: int
    name: str
    members: list[str]
    settings: dict[str, bool]

@rpc
def get_team(id: int) -> Team:
    return Team(id=1, name="Platform", ...)`;

const generatedCode = `// Auto-generated from get_team

interface Team {
  id: number;
  name: string;
  members: string[];
  settings: Record<string, boolean>;
}

interface Types {
  get_team(id: number): Promise<Team>;
}`;

const clientCode = `import { createClient, httpLink } from "@pyrpc/client";
import type { Types } from "@pyrpc/types";

const client = createClient<Types>({
  links: [httpLink({ url: "https://api.example.com" })],
});

// Autocomplete works across your stack
const team = await client.get_team(1);
//    ^? Team

console.log(team.members);
//          ^? string[]`;

export async function HeroHighlightedCode({ tab }: { tab: "server" | "generated" | "client" }) {
  const code = tab === "server" ? serverCode : tab === "generated" ? generatedCode : clientCode;

  const highlighted = await highlight(code, {
    lang: tab === "server" ? "python" : "typescript",
    ...shikiHighlightOptions,
    components: {
      pre: createPre(),
    },
  } satisfies HighlightOptions);

  return highlighted;
}
