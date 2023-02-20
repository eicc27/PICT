import { WebSocketServer } from "ws";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { SocketJobDispatcher } from "./SocketDispatcher.js";

export class Socket {
    private socket: WebSocketServer;

    public constructor(socket: WebSocketServer) {
        this.socket = socket;
    }

    public open(dispatcher: SocketJobDispatcher) {
        const that = this;
        this.socket.on("connection", function (socket) {
            LOGGER.info(
                `New socket connected. Total: ${that.socket.clients.size}`
            );
            socket.on("close", function () {
                LOGGER.info(
                    `Socket disconnected. Total: ${that.socket.clients.size}`
                );
            });
            socket.on("message", async function (data) {
                await dispatcher.dispatch(JSON.parse(data.toString()));
                // that.broadcast("hello world!");
            });
        });
    }

    @logfcall() public broadcast(message: string) {
        this.socket.clients.forEach((socket) => {
            socket.send(message);
        });
    }
}
