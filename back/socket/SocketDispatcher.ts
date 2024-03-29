import { PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { logfcall } from "../utils/Logger.js";
import { DownloadHandler } from "./DownloadHandler.js";
import { IndexHandler } from "./IndexHandler.js";
import { KeywordHandler } from "./KeywordHandler.js";
import { Socket } from "./Socket.js";

export class SocketJobDispatcher {
    private socket: Socket;
    public constructor(socket: Socket) {
        this.socket = socket;
    }

    @logfcall() public async dispatch(msg: any) {
        switch (msg.type) {
            case "keyword":
                await new KeywordHandler(msg.value, this.socket).handle();
                break;
            case "index":
                await new IndexHandler(this.socket).handle();
                break;
            case "download":
                await new DownloadHandler(this.socket).handle();
                break;
            case "clear":
                PIXCRAWL_DATA.clearKeywords();
                break;
        }
    }
}
