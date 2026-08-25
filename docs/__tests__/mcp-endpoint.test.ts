import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Client } from '@modelcontextprotocol/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

vi.mock('@/lib/source', () => ({
  source: {
    getPage: (slugs: string[] | undefined) => {
      if (!slugs || slugs.length === 0) return undefined;
      const joined = slugs.join('/');
      const knownPages: Record<string, { title: string; slugs: string[] }> = {
        'docs/overview': { title: 'Overview', slugs: ['docs', 'overview'] },
        'docs/quickstart': {
          title: 'Quickstart',
          slugs: ['docs', 'quickstart'],
        },
        'docs/get-started/index': {
          title: 'Get Started',
          slugs: ['docs', 'get-started', 'index'],
        },
      };
      const page = knownPages[joined];
      if (!page) return undefined;
      return {
        slugs: page.slugs,
        url: `/docs/${joined}`,
        data: {
          title: page.title,
          getText: async () =>
            `# ${page.title}\n\nThis is the ${page.title} page content.`,
        },
      };
    },
    generateParams: () => [],
  },
  getLLMText: async (page: {
    data: { title: string; getText: () => Promise<string> };
  }) => {
    return await page.data.getText();
  },
}));

vi.mock('fumadocs-core/search/server', () => ({
  createFromSource: () => ({
    search: async (query: string, options?: { limit?: number }) => {
      const limit = options?.limit ?? 5;
      const results = [
        {
          id: '/docs/overview',
          url: '/docs/overview',
          type: 'page' as const,
          content: 'Overview of pyRPC framework',
        },
        {
          id: '/docs/quickstart',
          url: '/docs/quickstart',
          type: 'page' as const,
          content: 'Quickstart guide for pyRPC',
        },
        {
          id: '/docs/get-started/index',
          url: '/docs/get-started',
          type: 'page' as const,
          content: 'Getting started with pyRPC',
        },
      ];
      const filtered = results.filter(
        (r) =>
          r.content.toLowerCase().includes(query.toLowerCase()) ||
          r.id.toLowerCase().includes(query.toLowerCase()),
      );
      return filtered.slice(0, limit);
    },
    GET: async () => new Response(JSON.stringify({ results: [] })),
    staticGET: async () => new Response(JSON.stringify({ results: [] })),
    export: async () => ({}),
  }),
}));

const { GET: metadataGET } = await import('../app/api/mcp-metadata/route');
const { GET: mcpGET, POST: mcpPOST } = await import('../app/api/mcp/route');

const MCP_ACCEPT = 'application/json, text/event-stream';

function makeRequest(
  url: string,
  opts?: { method?: string; headers?: Record<string, string>; body?: unknown },
): Request {
  const method = opts?.method ?? 'GET';
  const headers = new Headers(opts?.headers);
  const init: RequestInit = { method, headers };
  if (opts?.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
  }
  return new Request(url, init);
}

function makeMcpRequest(
  body: unknown,
  opts?: { host?: string; origin?: string },
): Request {
  return makeRequest('https://mcp.pyrpc.com/mcp', {
    method: 'POST',
    headers: {
      host: opts?.host ?? 'mcp.pyrpc.com',
      'content-type': 'application/json',
      accept: MCP_ACCEPT,
      ...(opts?.origin ? { origin: opts.origin } : {}),
    },
    body,
  });
}

function jsonRpcBody(
  method: string,
  params: unknown,
  id: number,
) {
  return { jsonrpc: '2.0', method, params, id };
}

async function parseSseResponse(res: Response): Promise<{
  result?: {
    serverInfo?: { name: string; version: string };
    capabilities?: Record<string, unknown>;
    tools?: Array<{ name: string }>;
    content?: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  error?: { code: number; message: string };
}> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream')) {
    const text = await res.text();
    const dataLines = text
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6));
    if (dataLines.length > 0) {
      return JSON.parse(dataLines[dataLines.length - 1]);
    }
    throw new Error('No data lines in SSE response');
  }
  return res.json();
}

describe('Metadata endpoint (GET /)', () => {
  it('returns the metadata JSON shape', async () => {
    const res = await metadataGET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      name: 'pyrpc-docs',
      version: '0.1.0',
      url: 'https://mcp.pyrpc.com/mcp',
      capabilities: {
        tools: {
          search_docs: expect.any(Object),
          get_doc: expect.any(Object),
        },
      },
      authentication: null,
    });
  });

  it('sets cache-control header', async () => {
    const res = await metadataGET();
    expect(res.headers.get('cache-control')).toContain('public');
  });
});

describe('MCP endpoint validation', () => {
  it('GET /mcp returns 405 in stateless mode', async () => {
    const req = makeRequest('https://mcp.pyrpc.com/mcp', {
      headers: { host: 'mcp.pyrpc.com' },
    });
    const res = await mcpGET(req);
    expect(res.status).toBe(405);
  });

  it('rejects requests with missing Host header', async () => {
    const req = makeRequest('https://mcp.pyrpc.com/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: MCP_ACCEPT,
      },
      body: jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      }, 1),
    });
    const res = await mcpPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects requests with invalid Host header', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      }, 1),
      { host: 'evil.com' },
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(403);
  });

  it('rejects requests with invalid Origin header', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      }, 1),
      { origin: 'https://evil.com' },
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(403);
  });

  it('accepts requests with valid Host and Origin', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      }, 1),
      { origin: 'https://mcp.pyrpc.com' },
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
  });

  it('accepts requests with valid Host and no Origin (non-browser client)', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      }, 1),
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
  });

  it('accepts pyrpc.com as valid Host', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      }, 1),
      { host: 'pyrpc.com' },
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
  });
});

describe('MCP protocol via HTTP handler', () => {
  it('initialize returns server info and capabilities', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      }, 1),
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
    const body = await parseSseResponse(res);
    expect(body.result).toBeDefined();
    expect(body.result!.serverInfo).toMatchObject({
      name: 'pyrpc-docs',
      version: '0.1.0',
    });
    expect(body.result!.capabilities).toBeDefined();
  });

  it('tools/list returns exactly search_docs and get_doc', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('tools/list', {}, 2),
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
    const body = await parseSseResponse(res);
    expect(body.result).toBeDefined();
    const toolNames = body.result!.tools!.map((t: { name: string }) => t.name);
    expect(toolNames).toContain('search_docs');
    expect(toolNames).toContain('get_doc');
    expect(toolNames).toHaveLength(2);
  });

  it('search_docs searches existing documentation', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('tools/call', {
        name: 'search_docs',
        arguments: { query: 'overview', limit: 3 },
      }, 3),
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
    const body = await parseSseResponse(res);
    expect(body.result).toBeDefined();
    expect(body.result!.content).toBeDefined();
    expect(body.result!.content!.length).toBeGreaterThan(0);
    const text = body.result!.content![0].text;
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_doc retrieves a real documentation page', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('tools/call', {
        name: 'get_doc',
        arguments: { path: '/docs/overview' },
      }, 4),
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
    const body = await parseSseResponse(res);
    expect(body.result).toBeDefined();
    expect(body.result!.content).toBeDefined();
    expect(body.result!.content!.length).toBeGreaterThan(0);
    const text = body.result!.content![0].text;
    expect(text).toContain('#');
  });

  it('get_doc returns error for nonexistent page', async () => {
    const req = makeMcpRequest(
      jsonRpcBody('tools/call', {
        name: 'get_doc',
        arguments: { path: '/docs/nonexistent-page-that-does-not-exist' },
      }, 5),
    );
    const res = await mcpPOST(req);
    expect(res.status).toBe(200);
    const body = await parseSseResponse(res);
    expect(body.result).toBeDefined();
    expect(body.result!.isError).toBe(true);
    expect(body.result!.content![0].text).toContain('not found');
  });
});

describe('MCP Client integration', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;

  beforeAll(async () => {
    server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(
        req.url ?? '/',
        `http://${req.headers.host ?? 'localhost'}`,
      );
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers[key] = value;
      }
      headers['host'] = 'mcp.pyrpc.com';

      let body: string | undefined;
      if (req.method === 'POST') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        body = Buffer.concat(chunks).toString();
      }

      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        body: body ?? undefined,
      });

      const response = await mcpPOST(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      const responseBody = await response.text();
      res.end(responseBody);
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const addr = server.address();
    if (addr && typeof addr === 'object') {
      baseUrl = `http://localhost:${addr.port}/mcp`;
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('client can initialize and list tools', async () => {
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl));
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(transport);

    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name);
    expect(toolNames).toContain('search_docs');
    expect(toolNames).toContain('get_doc');
    expect(toolNames).toHaveLength(2);

    await client.close();
  });

  it('client can call search_docs', async () => {
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl));
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(transport);

    const result = await client.callTool({
      name: 'search_docs',
      arguments: { query: 'overview', limit: 2 },
    });
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);

    await client.close();
  });

  it('client can call get_doc', async () => {
    const transport = new StreamableHTTPClientTransport(new URL(baseUrl));
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(transport);

    const result = await client.callTool({
      name: 'get_doc',
      arguments: { path: '/docs/overview' },
    });
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    const content = result.content as Array<{ type: string; text?: string }>;
    const text = content[0];
    expect(text.text).toContain('#');

    await client.close();
  });
});
