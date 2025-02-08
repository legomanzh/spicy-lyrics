import { io } from "socket.io-client";

export const socket = io("https://ws-sl.spikerko.org", {
    transports: ["websocket", "polling"],
    autoConnect: false,
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
});