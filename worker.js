export default {
  async fetch(request, env) {
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

    return response;
  },
};
