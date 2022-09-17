import axios from "axios";
import { WebSocket } from "ws";
import { createWriteStream, accessSync, writeFileSync, constants } from "fs";
import { ENV } from "../../config/environment";
import { Picture } from "../../types/Types";
import AsyncPool from "../AsyncPool";
import Timer from "../Timer";
import Logger, { axiosErrorLogger, SigLevel } from "../Logger";


/**
 * Firstly request for a content length(in bytes `B`) of the download target in a query pool,
 * then submit the parts of the download requests to a download pool.
 * 
 * For the tail blob that is smaller, it is joint within its predecessor.
 */
export default class AsyncDownloader {
    private pictures: Picture[];
    private ws: WebSocket;
    private blobSize: number;
    private queryPool = new AsyncPool(8);
    private downloadPool = new AsyncPool(16);

    public constructor(pictures: Picture[], ws: WebSocket, blobSize: number) {
        this.pictures = pictures;
        this.blobSize = blobSize;
        this.ws = ws;
    }

    private async queryOne(url: string) {
        for (let retrial = 0; retrial < ENV.SETTINGS.MAX_RETRIAL; retrial++) {
            if (retrial)
                (new Logger(`HEAD: Retrial #${retrial} of ${url}`, SigLevel.warn)).log();
            let res = await axios.get(url, {
                httpsAgent: ENV.PROXY_AGENT,
                method: 'HEAD',
                headers: ENV.HEADER,
                timeout: ENV.SETTINGS.TIMEOUT,
            }).then(async (resp) => {
                const contentLength = parseInt(resp.headers['content-length']);
                const blocks = Math.floor(contentLength / this.blobSize);
                const tailSize = contentLength % this.blobSize;
                let ranges = [1];
                for (let i = 1; i <= blocks; i++) {
                    if (i == blocks && tailSize)
                        ranges.push(i * this.blobSize + tailSize);
                    else
                        ranges.push(i * this.blobSize);
                }
                (new Logger(`Queried blob size of ${url}: ${contentLength}B`)).log();
                for (let i = 0; i < ranges.length - 1; i++) {
                    await this.downloadPool.submit((new Timer(10, ENV.SETTINGS.MAX_RETRIAL)).time(
                        this.downloadPart(url, ranges[i] - 1, ranges[i + 1]),
                    ));
                }
            }, async (error) => {
                axiosErrorLogger(error, url);
                if (retrial < ENV.SETTINGS.MAX_RETRIAL)
                    return retrial;
                else
                    (new Logger(`HEAD: Max retrial achieved for ${url}`, SigLevel.error)).log();
            });
            if (typeof res != 'number')
                return res;
        }
    }

    private async downloadPart(url: string, start: number, end: number) {
        for (let retrial = 0; retrial < ENV.SETTINGS.MAX_RETRIAL; retrial++) {
            if (retrial)
                (new Logger(`BLOCK: Retrial #${retrial} of ${url}(${start}-${end})`, SigLevel.warn)).log();
            let header = {
                'User-Agent': ENV.HEADER["User-Agent"],
                'Referer': ENV.HEADER.Referer,
                'Range': `bytes=${start}-${end}`
            };
            let res = await axios.get(url, {
                httpsAgent: ENV.PROXY_AGENT,
                headers: header,
                timeout: ENV.SETTINGS.TIMEOUT,
                responseType: 'stream',
            }).then((resp) => {
                let filename = url.split('/').at(-1);
                let path = `../lsp/${filename}`;
                try {
                    accessSync(path, constants.F_OK);
                } catch (error) {
                    writeFileSync(path, '', { flag: 'w+' });
                    (new Logger(`FS: Created new file ${filename}`)).log();
                }
                resp.data.pipe(createWriteStream(path, {
                    start: start,
                    flags: 'r+'
                }));
                resp.data.on('end', () => {
                    (new Logger(`Block: download of ${url}(${start}-${end}) done.`)).log();
                });
            }, async (error) => {
                axiosErrorLogger(error, url);
                if (retrial < ENV.SETTINGS.MAX_RETRIAL)
                    return retrial;
                else
                    (new Logger(`BLOCK: Max retrial achieved for ${url}(${start - end})`, SigLevel.error)).log();
            });
            if (typeof res != 'number')
                return res;
        }
    }

    public async download() {
        for (const picture of this.pictures) {
            for (const url of picture.originalUrls) {
                await this.queryPool.submit((new Timer(10, ENV.SETTINGS.MAX_RETRIAL)).time(
                    this.queryOne(url)
                ));
            }
        }
        await this.queryPool.close();
        // (new Logger('Query pool closed', SigLevel.ok)).log();
        await this.downloadPool.close();
        (new Logger('Download complete!', SigLevel.ok)).log();
    }
}