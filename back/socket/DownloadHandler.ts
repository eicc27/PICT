import chalk from "chalk";
import { WebSocket } from "ws";
import { PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { AsyncPool } from "../utils/AsyncPool.js";
import { Downloader } from "../utils/Downloader.js";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { Retrial } from "../utils/Retrial.js";
import { System, SYSTEM_SETTINGS } from "../utils/System.js";

export class DownloadHandler {
    private pictures: any[];
    private pictureIndexes: any = {};

    public constructor(pictures: any[]) {
        this.pictures = pictures;
        // set up indexes
        for (const picture of pictures) {
            const key = `${picture.pid}_${picture.index}`;
            const value = {
                total: 0,
                count: 0,
            }
            this.pictureIndexes[key] = value;
        }
    }

    @logfcall() public async handle() {
        PIXCRAWL_DATA.setDownloadProgress(this.pictures.length);
        PIXCRAWL_DATA.getSocket().send(JSON.stringify({
            type: 'download-total',
            value: this.pictures.length,
        }));
        System.mkdir('../lsp');
        const queryPool = new AsyncPool(16);
        const downloadPool = new AsyncPool(16);
        for (const picture of this.pictures) {
            const downloader = Downloader.blockDownload(picture, downloadPool, this.pictureIndexes);
            await queryPool.submit(Retrial.retry, downloader);
        }
        await queryPool.close();
        await downloadPool.close();
        LOGGER.ok('Download complete');
        // happy new year!
        LOGGER.easter(chalk.bgRedBright.white('🐇癸卯🐇'), chalk.bgRed.white('🐇年快乐！'));
    }
}