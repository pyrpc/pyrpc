const metadata = {
  name: 'pyRPC Documentation MCP Server',
  version: '0.1.0',
  mcp_endpoint: '/mcp',
};

export async function GET(): Promise<Response> {
  return Response.json(metadata, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
