import { NextRequest, NextResponse } from 'next/server';

const MCP_HOST = 'mcp.pyrpc.com';

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? '';

  if (hostname === MCP_HOST) {
    const path = request.nextUrl.pathname;

    if (path === '/mcp') {
      return NextResponse.rewrite(new URL('/api/mcp', request.url));
    }

    if (path === '/') {
      return NextResponse.rewrite(new URL('/api/mcp-metadata', request.url));
    }

    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|og/).*)'],
};
