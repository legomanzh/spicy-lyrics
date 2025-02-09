import SpicyFetch from "../API/SpicyFetch";
import { socket as ws } from "./ws/main";

export const UserData = Spicetify.Platform.initialUser;

window._spicy_lyrics.UserData = UserData;

export async function getUserData() {
    const [req, status] = await SpicyFetch("https://api.spotify.com/v1/me", true, false, false);
    if (status !== 200) {
        return;
    }

    const data: object | string = 
    ((typeof req === "string" && 
        (req.startsWith("{") || req.startsWith(`{"`) || req.startsWith("[") || req.startsWith(`["`)))
            ? JSON.parse(req) 
            : req);
    return data;
}

const Sockets = {
    sockets: {
        ws,
    },
    all: {
        ConnectSockets,
    },
}

async function ConnectSockets() {
    const APIUserData = await getUserData();
    for (const key of Object.keys(Sockets?.sockets)) {
        // console.log(`Connecting: ${key}`);
        Sockets.sockets[key].auth = {
            userData: {
                ID: UserData.username,
                me: APIUserData,
            }
        };
        await Sockets?.sockets[key]?.connect();
        // console.log(`${key} connected`);
    }
}

window._spicy_lyrics._sockets = Sockets;

export default Sockets;