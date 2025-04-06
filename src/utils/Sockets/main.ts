import { socket as ws } from "./ws/main";

const Sockets = {
    sockets: {
        ws,
    },
    all: {
        ConnectSockets,
    },
}

async function ConnectSockets() {
    for (const key of Object.keys(Sockets?.sockets)) {
        await Sockets?.sockets[key]?.connect();
    }
}

export default Sockets;