import { io } from "socket.io-client";
import { getUserData } from "../main";

export const socket = io("https://ws-sl.spikerko.org", {
    transports: ["websocket", "polling"],
    autoConnect: false,
});


socket.on("connect", () => {
    // console.log("Connected:", socket.id);
});

socket.on("request--state-revalidation", async () => {
    const userData = await getUserData();
    socket.emit("state-revalidation__user-data", userData, (resp) => {
        if (resp.success) {
            // console.log("User data updated", resp);
        } else {
            console.error("Failed to update user data", resp);
        }
    })
})

socket.on("disconnect", () => {
    // console.log("Disconnected:", socket.id);
});