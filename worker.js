export default {
  async fetch(request, env) {
    // 0. Optional Edge Rate Limiting (by client IP)
    if (env.RATE_LIMITER) {
      try {
        const clientIP = request.headers.get('cf-connecting-ip') || 'anonymous';
        const { success } = await env.RATE_LIMITER.limit({ key: clientIP });
        if (!success) {
          return new Response('Too Many Requests. Please slow down and try again shortly.', {
            status: 429,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Retry-After': '60',
            },
          });
        }
      } catch (_) {
        // Fall through gracefully if rate limiter check encounters an issue
      }
    }

    const url = new URL(request.url);
    const assets = env.ASSETS || env.CLOUD_FLARE_ASSET;

    // 1. Try to serve the static asset
    let response = assets ? await assets.fetch(request) : new Response('Assets binding not found', { status: 500 });

    // 2. SPA Fallback: If 404 and it's a browser page route, serve /index.html
    if (response.status === 404 && request.method === 'GET') {
      const pathname = url.pathname;
      const lastSegment = pathname.substring(pathname.lastIndexOf('/'));
      // Only rewrite paths without a file extension (e.g. /orders, /checkout, /admin)
      if (!lastSegment.includes('.') && assets) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        response = await assets.fetch(indexRequest);
      }
    }

    // 3. Attach performance & cache-control headers for successful asset responses
    if (response.status >= 200 && response.status < 400) {
      const headers = new Headers(response.headers);
      const pathname = url.pathname;

      if (pathname.startsWith('/assets/')) {
        // Hashed Vite JS/CSS chunks are immutable and safe to cache for 1 year
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(webp|png|jpg|jpeg|svg|ico|woff2?)$/i.test(pathname)) {
        // Static images and fonts cache for 7 days with background revalidation
        headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      } else if (headers.get('content-type')?.includes('text/html')) {
        // HTML is served fresh to ensure instant deployment rollouts
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
