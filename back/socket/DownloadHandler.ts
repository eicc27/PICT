import { PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { AsyncPool } from "../utils/AsyncPool.js";
import { Downloader } from "../utils/Downloader.js";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { Retrial } from "../utils/Retrial.js";
import { System } from "../utils/System.js";
import { BaseHandler } from "./BaseHandler.js";
import { Socket } from "./Socket.js";

export class DownloadHandler extends BaseHandler {
    private pictureIndexes: any = {};

    public constructor(socket: Socket) {
        super(socket);
        // set up indexes
        for (let i = 0; i < PIXCRAWL_DATA.getLength(); i++) {
            const pictures = PIXCRAWL_DATA.getKeyword(i).pictures;
            for (const picture of pictures) {
                if (!picture.index) continue;
                for (let i = 0; i < picture.index; i++) {
                    const key = `${picture.pid}_${i}`;
                    const value = {
                        total: 0,
                        count: 0,
                    };
                    this.pictureIndexes[key] = value;
                }
            }
        }
        console.log(Object.keys(this.pictureIndexes).length);
    }

    @logfcall() public async handle() {
        System.mkdir("../lsp");
        const queryPool = new AsyncPool(16);
        const downloadPool = new AsyncPool(16);
        for (let i = 0; i < PIXCRAWL_DATA.getLength(); i++) {
            const pictures = PIXCRAWL_DATA.getKeyword(i).pictures;
            for (const picture of pictures) {
                if (!picture.index) continue;
                for (let i = 0; i < picture.index; i++) {
                    const pictureCopy = JSON.parse(JSON.stringify(picture));
                    pictureCopy.index = i;
                    const downloader = Downloader.blockDownload(
                        pictureCopy,
                        downloadPool,
                        this.pictureIndexes,
                        this.socket
                    );
                    await queryPool.submit(Retrial.retry, downloader);
                }
            }
            await queryPool.close();
            await downloadPool.close();
            LOGGER.ok("Download complete");
        }
    }
}
