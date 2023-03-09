import axios from "axios";
import * as fs from "fs";
import { AsyncPool } from "./AsyncPool.js";
import { Retrial } from "./Retrial.js";
import { Picture, PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { HEADERS, PROXY, System } from "./System.js";
import { SQLITE_DB } from "./SQLite.js";
import { logfcall, LOGGER } from "./Logger.js";
import { Socket } from "../socket/Socket.js";

export class Downloader {
    private url: string;

    public constructor(url: string) {
        this.url = url;
    }

    @logfcall() public async download() {
        LOGGER.info(`url: ${this.url}`);
        const response = await axios.get(this.url, {
            headers: HEADERS,
            httpsAgent: PROXY,
            responseType: "arraybuffer",
        });
        const data = response.data;
        return data;
    }

    @logfcall() public static blockDownload(
        picture: Picture,
        downloadPool: AsyncPool,
        index: any,
        socket: Socket
    ) {
        if (!picture.url) return;
        const url = picture.url.replace('_p0', `_p${picture.index}`);
        const key = `${picture.pid}_${picture.index}`;
        const fpath = `../lsp/${key}.png`;
        const block = async function (start?: number, end?: number) {
            const headers: any = JSON.parse(JSON.stringify(HEADERS));
            if (end) headers.range = `bytes=${start}-${end}`;
            const blockResponse = await axios.get(url, {
                headers: headers,
                httpsAgent: PROXY,
                responseType: "stream",
            });
            System.newFile(fpath);
            const data = blockResponse.data;
            data.pipe(
                fs.createWriteStream(fpath, {
                    start: start,
                    flags: "r+",
                })
            );
            index[key].count++;
            // download of 1 picture ends
            if (index[key].count == index[key].total) {
                PIXCRAWL_DATA.addDownloadProgress();
                socket.broadcast(
                    JSON.stringify({
                        type: "download",
                        value: PIXCRAWL_DATA.getDownloadProgress(),
                    })
                );
                SQLITE_DB.addPicture(picture);
            }
        };
        const query = async function () {
            try {
                const headerResponse = await axios.head(url, {
                    headers: HEADERS,
                    httpsAgent: PROXY,
                });
                const data = headerResponse.headers;
                const lengthString = data["content-length"];
                if (!lengthString) return;
                const length = parseInt(lengthString);
                const blksize = 512 * 1024;
                const blks = Math.ceil(length / blksize);
                index[key].total = blks;
                for (let i = 0; i < blks; i++) {
                    const start = i * blksize;
                    const end = Math.min((i + 1) * blksize, length);
                    await downloadPool.submit(Retrial.retry, block, start, end);
                }
            } catch (error: any) {
                // range not accepted
                if (error.response && error.response.status == 416) { 
                    LOGGER.warn(`${picture.pid}: Range not accepted.`);
                    index[key].total = 1;
                    await downloadPool.submit(Retrial.retry, block);
                    return;
                }
                else throw error;
            }
        }
        return query;
    }
}
