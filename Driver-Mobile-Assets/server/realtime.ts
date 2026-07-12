import type { Server } from "node:http";
import { WebSocketServer } from "ws";

type ClientRole = "rider" | "driver";

type RealtimeClient = {
  socket: any;
  id?: string;
  role?: ClientRole;
};

const clients = new Set<RealtimeClient>();

function send(client: RealtimeClient, type: string, payload: unknown = {}) {
  if (client.socket.readyState === client.socket.OPEN) {
    client.socket.send(JSON.stringify({ type, payload }));
  }
}

function broadcast(
  type: string,
  payload: unknown,
  predicate: (client: RealtimeClient) => boolean,
) {
  clients.forEach((client) => {
    if (predicate(client)) {
      send(client, type, payload);
    }
  });
}

export function setupRealtimeServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket: any) => {
    const client: RealtimeClient = { socket };
    clients.add(client);

    socket.on("message", (raw: Buffer | string) => {
      let message: Record<string, any>;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        send(client, "error", { message: "Invalid JSON message" });
        return;
      }

      if (message.type === "auth") {
        client.role = message.role;
        client.id = message.id;
        send(client, "auth_ok", { id: client.id, role: client.role });
        return;
      }

      if (message.type === "ride_request") {
        const rideId = message.rideId || `ride_${Date.now()}`;
        const payload = {
          ...message,
          rideId,
          riderId: client.id,
        };

        broadcast("ride_request", payload, (candidate) => candidate.role === "driver");
        send(client, "ride_requested", { rideId });
        return;
      }

      if (message.type === "ride_accepted") {
        const payload = {
          ...message,
          driverId: client.id,
        };

        broadcast(
          "ride_accepted",
          payload,
          (candidate) => candidate.role === "rider" && candidate.id === message.riderId,
        );
        return;
      }

      if (message.type === "trip_status_update") {
        broadcast(
          "trip_status_changed",
          { status: message.status, driverId: client.id },
          (candidate) => candidate.role === "rider" && candidate.id === message.riderId,
        );
        return;
      }

      if (message.type === "location_update") {
        broadcast(
          "driver_location_changed",
          { location: message.location, driverId: client.id },
          (candidate) => candidate.role === "rider",
        );
      }
    });

    socket.on("close", () => {
      clients.delete(client);
    });
  });

  return wss;
}
