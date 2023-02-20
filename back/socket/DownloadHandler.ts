import { AsyncPool } from "../utils/AsyncPool.js";
import { Downloader } from "../utils/Downloader.js";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { Retrial } from "../utils/Retrial.js";
import { System } from "../utils/System.js";
import { BaseHandler } from "./BaseHandler.js";
import { Socket } from "./Socket.js";

export class DownloadHandler extends BaseHandler {
    private pictures: any[];
    private pictureIndexes: any = {};

    public constructor(pictures: any[], socket: Socket) {
        super(socket);
        this.pictures = pictures;
        // set up indexes
        for (const picture of pictures) {
            const key = `${picture.pid}_${picture.index}`;
            const value = {
                total: 0,
                count: 0,
            };
            this.pictureIndexes[key] = value;
        }
    }

    @logfcall() public async handle() {
        this.socket.broadcast(
            JSON.stringify({
                type: "download-total",
                value: this.pictures.length,
            })
        );
        System.mkdir("../lsp");
        const queryPool = new AsyncPool(16);
        const downloadPool = new AsyncPool(16);
        for (const picture of this.pictures) {
            const downloader = Downloader.blockDownload(
                picture,
                downloadPool,
                this.pictureIndexes,
                this.socket
            );
            await queryPool.submit(Retrial.retry, downloader);
        }
        await queryPool.close();
        await downloadPool.close();
        LOGGER.ok("Download complete");
    }
}
