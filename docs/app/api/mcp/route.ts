import { source, getLLMText } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import {
  createMcpHandler,
  McpServer,
  hostHeaderValidationResponse,
  originValidationResponse,
} from '@modelcontextprotocol/server';
import { z } from 'zod/v4';

const searchAPI = createFromSource(source, { language: 'english' });

const server = new McpServer({
  name: 'pyrpc-docs',
  version: '0.1.0',
});

server.registerTool(
  'search_docs',
  {
    description:
      'Search pyRPC documentation. Returns matching pages with titles, URLs, and content excerpts. Use this to find relevant docs before reading a specific page.',
    inputSchema: {
      query: z.string().describe('Search query string'),
      limit: z
        .number()
        .optional()
        .describe('Maximum number of results to return (default 5)'),
    },
  },
  async ({ query, limit }) => {
    const results = await searchAPI.search(query, { limit: limit ?? 5 });
    const text = results
      .map((r) => {
        const parts = [`## ${r.id}`];
        parts.push(`URL: ${r.url}`);
        if (r.type === 'heading' || r.type === 'text') {
          parts.push(r.content);
        }
        return parts.join('\n');
      })
      .join('\n\n---\n\n');
    return {
      content: [{ type: 'text', text: text || 'No results found.' }],
    };
  },
);

server.registerTool(
  'get_doc',
  {
    description:
      'Retrieve the full content of a specific pyRPC documentation page. Pass the URL path (e.g. "/docs/overview" or "/docs/quickstart"). Returns markdown content.',
    inputSchema: {
      path: z
        .string()
        .describe(
          'Documentation page path, e.g. "/docs/overview", "/docs/quickstart"',
        ),
    },
  },
  async ({ path }) => {
    const slug = path
      .replace(/^\//, '')
      .split('/')
      .filter(Boolean);
    const page = source.getPage(slug);
    if (!page) {
      throw new Error(`Documentation page not found: ${path}`);
    }
    const content = await getLLMText(page);
    return {
      content: [{ type: 'text', text: content }],
    };
  },
);

const ALLOWED_HOSTS = ['mcp.pyrpc.com', 'pyrpc.com'];
const ALLOWED_ORIGINS = ['mcp.pyrpc.com', 'pyrpc.com'];

const handler = createMcpHandler(() => server, { legacy: 'stateless' });

function validate(request: Request): Response | undefined {
  return (
    hostHeaderValidationResponse(request, ALLOWED_HOSTS) ??
    originValidationResponse(request, ALLOWED_ORIGINS)
  );
}

export async function GET(request: Request): Promise<Response> {
  return validate(request) ?? handler.fetch(request);
}

export async function POST(request: Request): Promise<Response> {
  return validate(request) ?? handler.fetch(request);
}
