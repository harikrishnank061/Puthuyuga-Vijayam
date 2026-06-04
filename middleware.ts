import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only process CORS for /api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // If it's a preflight OPTIONS request, return 204 immediately with CORS headers
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400');
      return response;
    }
  }

  const response = NextResponse.next();
  
  // Add CORS headers to all dynamic API responses as well
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
