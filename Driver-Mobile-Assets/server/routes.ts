import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { setupRealtimeServer } from "./realtime";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);
  setupRealtimeServer(httpServer);

  return httpServer;
}
