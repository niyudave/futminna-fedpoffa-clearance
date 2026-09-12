import 'dotenv/config';
import http from 'http';
import express from 'express';
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  getPrismaClient,
  checkDatabaseConnectivity,
  recordFallbackTriggered,
  printInMemoryBanner,
  dbStore,
} from "./src/server/db/client";
import { socketServer } from "./src/server/notifications/socketServer";
import { createApp } from "./src/server/app";

async function startServer() {
  const app = createApp();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // ------------------------------------------------------------------------
  // Database Mode & Startup Persistence Enforcement
  // ------------------------------------------------------------------------
  const isProduction = process.env.NODE_ENV === "production";
  const rawDbMode = process.env.DB_MODE;
  const dbMode = (rawDbMode || (isProduction ? "MYSQL" : "AUTO")).toUpperCase();

  console.log(`[Database Startup] Environment: ${process.env.NODE_ENV || "development"} | DB_MODE: ${rawDbMode || `(unset -> defaulting to ${dbMode})`}`);

  const strictMysql = dbMode === "MYSQL" || (isProduction && rawDbMode !== "AUTO" && rawDbMode !== "IN_MEMORY");

  if (strictMysql) {
    console.log("[Database Startup] Production / Strict MySQL persistence mode active. Attempting Prisma connection (prisma.$connect())...");
    const prisma = getPrismaClient();
    if (!prisma) {
      console.error("================================================================================");
      console.error("[FATAL DATABASE ERROR] Production / DB_MODE=MYSQL startup check failed:");
      console.error("  DATABASE_URL environment variable is missing, invalid, or Prisma client failed to initialize.");
      console.error("  Cannot start server in production without a valid MySQL connection.");
      console.error("  Process will now exit to prevent silent data loss.");
      console.error("================================================================================");
      process.exit(1);
    }

    try {
      const isReachable = await checkDatabaseConnectivity(true);
      if (!isReachable) {
        throw new Error("Database server host is not reachable or connection timed out");
      }
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log("✓ [Database Startup] Prisma connected successfully to live MySQL database.");

      const hydrated = await dbStore.hydrateFromDatabase();
      if (!hydrated) {
        // strictMysql mode requires genuine persistence — a connection that
        // reports success but fails to hydrate (e.g. migrations not applied)
        // must not silently fall back to the in-memory demo dataset.
        throw new Error("Connected to MySQL but failed to load/bootstrap application data from it (see logs above).");
      }
    } catch (err: any) {
      console.error("================================================================================");
      console.error("[FATAL DATABASE ERROR] Prisma connection (prisma.$connect()) failed in production / DB_MODE=MYSQL:");
      console.error(`  Details: ${err?.message || err}`);
      console.error("  Failed to establish connection to MySQL database via Prisma ORM.");
      console.error("  Silent fallback to in-memory store is disabled in production to prevent silent data loss.");
      console.error("  Process will now exit.");
      console.error("================================================================================");
      process.exit(1);
    }
  } else {
    // Development mode with visible fallback behavior
    let isConnected = false;
    try {
      const isReachable = await checkDatabaseConnectivity();
      const prisma = getPrismaClient();
      if (isReachable && prisma) {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        isConnected = true;
        console.log("✓ [Database Startup] Connected to live MySQL database via Prisma.");
      }
    } catch {
      isConnected = false;
    }

    if (isConnected) {
      const hydrated = await dbStore.hydrateFromDatabase();
      if (!hydrated) {
        // Connection succeeded but hydration didn't — fall back visibly
        // rather than running with a half-loaded in-memory cache.
        isConnected = false;
      }
    }

    if (!isConnected) {
      recordFallbackTriggered("Startup connection check");
      printInMemoryBanner();
    }
  }

  // Initialize Socket.io Real-Time Server
  socketServer.init(httpServer);

  // Vite Middleware for SPA serving in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`FUTMINNA-FEDPOFFA Clearance Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

