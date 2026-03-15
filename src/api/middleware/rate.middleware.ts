/**
 * Rate Limiting Middleware
 *
 * This middleware limits the number of requests a client can make within a specified time window.
 *
 * @param limit The maximum number of requests a client can make within the time window.
 * @param windowMs The time window in milliseconds.
 * @returns A middleware function that enforces rate limiting.
 */
export default function rateHandler(limit: number, windowMs: number) {
  const clients = new Map<string, { count: number; firstRequestTime: number }>();

  return function (req: any, res: any, next: any) {
    const clientIp = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();

    if (!clients.has(clientIp)) {
      clients.set(clientIp, { count: 1, firstRequestTime: currentTime });
      return next();
    }

    const clientData = clients.get(clientIp)!;
    if (currentTime - clientData.firstRequestTime < windowMs) {
      if (clientData.count >= limit) {
        return res.status(429).json({ error: "Too many requests" });
      }
      clientData.count++;
    } else {
      clients.set(clientIp, { count: 1, firstRequestTime: currentTime });
    }
    next();
  };
}
