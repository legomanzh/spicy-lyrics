import { io } from "socket.io-client";
import { getUserData } from "../main";
/* import TransferElement from "../../../components/Utils/TransferElement";
import Global from "../../../components/Global/Global"; */

export const socket = io("https://ws.spicylyrics.org", {
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 1000,
    timeout: 5000,
    reconnectionAttempts: Infinity,
});


socket.on("connect", () => {
    //console.log("Connected:", socket.id);
    /* Spicetify.PopupModal.hide();
    if (document.head.querySelector("#GenericModal__SpicyLyrics-Styles")) {
        document.head.querySelector("#GenericModal__SpicyLyrics-Styles").remove();
    } */
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

socket.on("connect_error", () => {
  // revert to classic upgrade
  socket.io.opts.transports = ["polling", "websocket"];
});