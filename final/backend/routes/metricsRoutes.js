const express = require('express');
const router = express.Router();
const os = require('os');

const startTime = Date.now();
const requestCounts = { total: 0, errors: 0, byRoute: {} };

// Middleware to count requests (attach to app in server.js)
const countRequests = (req, res, next) => {
  requestCounts.total++;
  const route = `${req.method} ${req.path}`;
  requestCounts.byRoute[route] = (requestCounts.byRoute[route] || 0) + 1;
  const orig = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) requestCounts.errors++;
    return orig(body);
  };
  next();
};

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Monitoring]
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    node: process.version,
  });
});

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: System metrics for monitoring dashboard
 *     tags: [Monitoring]
 */
router.get('/metrics', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const mem = process.memoryUsage();

  res.json({
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'unknown',
      loadAvg: os.loadavg(),
      totalMemoryMB: Math.round(totalMem / 1024 / 1024),
      freeMemoryMB: Math.round(freeMem / 1024 / 1024),
      usedMemoryPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    },
    process: {
      pid: process.pid,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMemoryMB: Math.round(mem.rss / 1024 / 1024),
    },
    requests: {
      total: requestCounts.total,
      errors: requestCounts.errors,
      successRate: requestCounts.total
        ? Math.round(((requestCounts.total - requestCounts.errors) / requestCounts.total) * 100)
        : 100,
      topRoutes: Object.entries(requestCounts.byRoute)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([route, count]) => ({ route, count })),
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = { router, countRequests };
