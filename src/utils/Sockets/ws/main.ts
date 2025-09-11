import { io } from "npm:socket.io-client";

export const socket = io("https://ws.spicylyrics.org", {
  transports: ["polling", "websocket"],
  autoConnect: false,
  timeout: 30000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 100000,
  retries: Infinity,
  ackTimeout: 20000,
  path: "/",
});

socket.on("connect", () => {
  console.log("[Socket.IO] Socket Connected");
  console.log("[Socket.IO] Using Transport:", socket.io.engine.transport.name);

  socket.io.engine.on("upgrade", (transport) => {
    console.log("[Socket.IO] Upgraded transport to:", transport.name);
  });
});

socket.on("disconnect", () => {
  console.warn("[Socket.IO] Socket Disconnected");
});

socket.on("connect_error", (e) => {
  console.error("[Socket.IO] Socket Error", e);
});
