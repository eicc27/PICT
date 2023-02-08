import axios from "axios";
import httpsProxyAgent from 'https-proxy-agent';
import * as fs from 'fs';
import { AsyncPool } from "./AsyncPool.js";
import { Retrial } from "./Retrial.js";
import { Picture, PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { HEADERS, PROXY, System, SYSTEM_SETTINGS } from "./System.js";
import { SQLITE_DB } from "./SQLite.js";
import { logfcall, LOGGER } from "./Logger.js";
import chalk from 'chalk';

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
            responseType: 'arraybuffer',
        });
        const data = response.data;
        return data;
    }

    @logfcall() public static blockDownload(picture: Picture, downloadPool: AsyncPool, index: any) {
        const url = picture.url;
        const key = `${picture.pid}_${picture.index}`;
        const fpath = `../lsp/${key}.png`;
        const block = async function (start?: number, end?: number) {
            end ? LOGGER.info(`GET ${chalk.blue(url)} RANGE ${chalk.yellowBright(start)}-${chalk.yellowBright(end)}`)
                : LOGGER.info(`GET ${chalk.blue(url)} BLOCK`);
            const headers: any = HEADERS;
            if (end) headers.range = `bytes=${start}-${end}`;
            const blockResponse = await axios.get(url, {
                headers: headers,
                httpsAgent: PROXY,
                responseType: 'stream'
            });
            System.newFile(fpath);
            const data = blockResponse.data;
            data.pipe(fs.createWriteStream(fpath, {
                start: start,
                flags: 'r+'
            }));
            index[key].count++;
            // download ends
            if (index[key].count == index[key].total) {
                PIXCRAWL_DATA.addDownloadProgress();
                PIXCRAWL_DATA.getSocket().send(JSON.stringify({
                    type: 'download',
                }));
                SQLITE_DB.addPicture(picture);
            }
        }
        const query = async function () {
            console.log(`HEAD ${chalk.blueBright(url)}`);
            const headerResponse = await axios.head(url, {
                headers: HEADERS,
                httpsAgent: PROXY,
            });
            const data = headerResponse.headers;
            const acceptRanges = data['accept-ranges'];
            if (!acceptRanges) {
                index[key].total = 1;
                await downloadPool.submit(Retrial.retry, block);
                return;
            }
            const lengthString = data['content-length'];
            if (!lengthString)
                return;
            const length = parseInt(lengthString);
            const blksize = 512 * 1024;
            const blks = Math.ceil(length / blksize);
            index[key].total = blks;
            for (let i = 0; i < blks; i++) {
                const start = i * blksize;
                const end = Math.min((i + 1) * blksize, length);
                await downloadPool.submit(Retrial.retry, block, start, end);
            }
        }
        return query;
    }
}