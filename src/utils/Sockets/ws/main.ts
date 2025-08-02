import { io } from "socket.io-client";

export const socket = io("https://ws.spicylyrics.org", {
    transports: ["polling", "websocket"],
    autoConnect: false,
    timeout: 60000,
    reconnection: false,
    reconnectionAttempts: 1,
    path: "/"
});

let disconnectionInt: ReturnType<typeof setInterval> | null = null;

socket.on("connect", () => {
    if (disconnectionInt) {
        clearInterval(disconnectionInt);
        disconnectionInt = null;
    }
    // console.log("[Socket.IO] Socket Connected")
    // console.log("[Socket.IO] Using Transport:", socket.io.engine.transport.name)

    /* socket.io.engine.on("upgrade", (transport) => {
        console.log("[Socket.IO] Upgraded transport to:", transport.name);
    }); */
});

socket.on("disconnect", () => {
    if (!disconnectionInt) {
        disconnectionInt = setInterval(() => {
            socket.connect();
        }, 5000);
        socket.connect();
    }
    console.warn("[Socket.IO] Socket Disconnected")
});

socket.on("connect_error", (e) => {
    if (!disconnectionInt) {
        disconnectionInt = setInterval(() => {
            socket.connect();
        }, 5000);
        socket.connect();
    }
    console.error("[Socket.IO] Socket Error", e)
});
