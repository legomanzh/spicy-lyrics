import { io } from "socket.io-client";
import { getUserData } from "../main";
import Global from "../../../components/Global/Global";
/* import TransferElement from "../../../components/Utils/TransferElement";
import Global from "../../../components/Global/Global"; */

export const socket = io("https://ws.spicylyrics.org", {
    transports: ["websocket", "polling"],
    autoConnect: false,
    timeout: 60000,
    reconnection: false,
    reconnectionAttempts: 1,
});

const connectionStatusEventName = "sockets:ws:connection-status-change";
let disconnectionInt;

socket.on("connect", () => {
    //console.log("Connected:", socket.id);
    /* Spicetify.PopupModal.hide();
    if (document.head.querySelector("#GenericModal__SpicyLyrics-Styles")) {
        document.head.querySelector("#GenericModal__SpicyLyrics-Styles").remove();
    } */
    if (disconnectionInt) {
        clearInterval(disconnectionInt);
        disconnectionInt = null;
    }
    Global.Event.evoke(connectionStatusEventName, { connected: socket.connected, socket });
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

/* socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    Spicetify.PopupModal.display({
        title: "Spicy Lyrics - Error",
        content: `
            <h3>You have been disconnected from our service.</h3>
            <h2>Please wait while we recconect you.</h2>
            <br><br>
            <button onclick="window._spicy_lyrics._sockets._recconect_ws?.func();" class="Button-sc-y0gtbx-0 Button-buttonSecondary-small-useBrowserDefaultFocusStyle encore-text-body-small-bold" data-encore-id="buttonSecondary">
              Recconect Manually
            </button>
        `,
    })

    const modalElement = document.querySelector(".GenericModal")
    modalElement.querySelector(".main-trackCreditsModal-closeBtn")?.remove();
    TransferElement(modalElement, document.querySelector("generic-modal"));
    const modalOverlayElement = document.querySelector(".GenericModal__overlay");
    modalOverlayElement?.remove();
    
    const style = document.createElement("style");
    style.id = "GenericModal__SpicyLyrics-Styles"
    style.innerHTML = `
        .GenericModal {
            background-color: rgba(var(--spice-rgb-shadow), .7);
            bottom: 0;
            display: -webkit-box;
            display: -ms-flexbox;
            display: flex;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            z-index: 9999;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            overflow: hidden;
        }
    `
    document.head.appendChild(style);
}); */

/* Global.SetScope("_sockets._recconect_ws", {
    func: () => {
        socket.connect();
    }
}) */


socket.on("disconnect", () => {
    Global.Event.evoke(connectionStatusEventName, { connected: socket.connected, socket });
    if (!disconnectionInt) {
        disconnectionInt = setInterval(() => {
            socket.connect();
        }, 61000)
        socket.connect();
    }
});

socket.on("connect_error", () => {
    //socket.io.opts.transports = ["polling", "websocket"];
    Global.Event.evoke(connectionStatusEventName, { connected: socket.connected, socket });
    if (!disconnectionInt) {
        disconnectionInt = setInterval(() => {
            socket.connect();
        }, 61000)
        socket.connect();
    }
});

/* setInterval(() => {
    Global.Event.evoke(connectionStatusEventName, { connected: socket.connected, socket });
    console.log("Evoked!")
}, 2000) */