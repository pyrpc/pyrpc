const metadata = {
  name: 'pyrpc-docs',
  description: 'pyRPC documentation MCP server. Search and read pyRPC docs.',
  version: '0.1.0',
  url: 'https://mcp.pyrpc.com/mcp',
  capabilities: {
    tools: {
      search_docs: {
        description:
          'Search pyRPC documentation. Returns matching pages with titles, URLs, and content excerpts.',
      },
      get_doc: {
        description:
          'Retrieve the full content of a specific pyRPC documentation page.',
      },
    },
  },
  authentication: null,
};

export async function GET(): Promise<Response> {
  return Response.json(metadata, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
