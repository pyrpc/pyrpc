import HomeClient from "./home-client";
import { HeroHighlightedCode } from "./highlighted-code";
import { QuickstartSnippet1, QuickstartSnippet2, QuickstartSnippet3 } from "./highlighted-snippets";

export default async function HomePage() {
  const [serverCode, generatedCode, clientCode, snippet1, snippet2, snippet3] = await Promise.all([
    HeroHighlightedCode({ tab: "server" }),
    HeroHighlightedCode({ tab: "generated" }),
    HeroHighlightedCode({ tab: "client" }),
    QuickstartSnippet1(),
    QuickstartSnippet2(),
    QuickstartSnippet3(),
  ]);

  return (
    <HomeClient
      serverCode={serverCode}
      generatedCode={generatedCode}
      clientCode={clientCode}
      snippet1={snippet1}
      snippet2={snippet2}
      snippet3={snippet3}
    />
  );
}
