import { io } from "socket.io-client";

export const socket = io("https://ws.spicylyrics.org", {
    transports: ["websocket", "polling"],
    autoConnect: false,
    timeout: 60000,
    reconnection: false,
    reconnectionAttempts: 1,
});

let disconnectionInt: ReturnType<typeof setInterval> | null = null;

socket.on("connect", () => {
    if (disconnectionInt) {
        clearInterval(disconnectionInt);
        disconnectionInt = null;
    }
});

socket.on("disconnect", () => {
    if (!disconnectionInt) {
        disconnectionInt = setInterval(() => {
            socket.connect();
        }, 2000);
        socket.connect();
    }
});

socket.on("connect_error", () => {
    if (!disconnectionInt) {
        disconnectionInt = setInterval(() => {
            socket.connect();
        }, 2000);
        socket.connect();
    }
});
