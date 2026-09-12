import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight Timing Middleware
 * Instruments every HTTP request to measure exact server response time in milliseconds,
 * logging the method, route, HTTP status code, and duration without altering response behavior.
 */
export function timingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  // Safely hook writeHead to attach an X-Response-Time header without affecting response behavior
  const originalWriteHead = res.writeHead.bind(res);
  // @ts-ignore
  res.writeHead = (...args: any[]) => {
    if (!res.headersSent) {
      const now = process.hrtime.bigint();
      const elapsedMs = (Number(now - start) / 1_000_000).toFixed(2);
      try {
        res.setHeader('X-Response-Time', `${elapsedMs}ms`);
      } catch {
        // Ignore header errors if already committed
      }
    }
    return originalWriteHead(...args);
  };

  // Log on finish after response has been fully flushed to client
  res.on('finish', () => {
    const route = req.originalUrl || req.url;

    // Skip internal Vite development bundler and static module asset fetches
    const isDevAsset =
      route.startsWith('/src/') ||
      route.startsWith('/@') ||
      route.startsWith('/node_modules/') ||
      route.startsWith('/public/') ||
      route.startsWith('/assets/') ||
      /\.(tsx?|jsx?|css|svg|png|jpg|jpeg|ico|woff2?|map)(\?.*)?$/i.test(route);

    if (isDevAsset) {
      return;
    }

    const end = process.hrtime.bigint();
    const durationMs = (Number(end - start) / 1_000_000).toFixed(2);
    console.log(`[LATENCY] ${req.method} ${route} (HTTP ${res.statusCode}) - ${durationMs}ms`);
  });

  next();
}
