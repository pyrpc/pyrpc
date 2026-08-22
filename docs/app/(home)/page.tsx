import HomeClient from "./home-client";
import {
  QuickstartSnippet1,
  QuickstartSnippet2,
  QuickstartSnippet3,
  SNIPPET_1_TEXT,
  SNIPPET_2_TEXT,
  SNIPPET_3_TEXT,
} from "./highlighted-snippets";

export default async function HomePage() {
  const [snippet1, snippet2, snippet3] = await Promise.all([
    QuickstartSnippet1(),
    QuickstartSnippet2(),
    QuickstartSnippet3(),
  ]);

  return (
    <HomeClient
      snippet1={snippet1}
      snippet2={snippet2}
      snippet3={snippet3}
      text1={SNIPPET_1_TEXT}
      text2={SNIPPET_2_TEXT}
      text3={SNIPPET_3_TEXT}
    />
  );
}
