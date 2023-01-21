import WebSocket from "ws";
import { PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { logfcall } from "../utils/Logger.js";
import { DownloadHandler } from "./DownloadHandler.js";
import { IndexHandler } from "./IndexHandler.js";
import { KeywordHandler } from "./SearchHandler.js";

export class SocketJobDispatcher {
    private msg: { type: string, value: any };
    private socket: WebSocket;

    public constructor(msg: string, socket: WebSocket) {
        this.msg = JSON.parse(msg);
        this.socket = socket;
    }

    @logfcall() public async dispatch() {
        switch (this.msg.type) {
            case 'keyword':
                PIXCRAWL_DATA.resetDownloadData();
                PIXCRAWL_DATA.resetIndexData();
                PIXCRAWL_DATA.resetSearchData();
                await new KeywordHandler(this.msg.value.keywords).handle();
                break;
            case 'index':
                PIXCRAWL_DATA.resetIndexData();
                PIXCRAWL_DATA.resetDownloadData();
                await new IndexHandler(this.msg.value).handle();
                break;
            case 'download':
                PIXCRAWL_DATA.resetDownloadData();
                await new DownloadHandler(this.msg.value).handle();
                break;
        }
    }
}