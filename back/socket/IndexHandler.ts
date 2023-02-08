/**
 * TODO: deal with 429 too many requests error.
 */

import axios, { AxiosError } from "axios";
import WebSocket from "ws";
import { AsyncPool } from "../utils/AsyncPool.js";
import httpsProxyAgent from 'https-proxy-agent';
import { Retrial } from "../utils/Retrial.js";
import { PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { HEADERS, PROXY, System, SYSTEM_SETTINGS } from "../utils/System.js";
import chalk from "chalk";


export class IndexHandler {
    private pids: string[];

    public constructor(pids: string[]) {
        this.pids = pids;
    }

    @logfcall() public async handle() {
        PIXCRAWL_DATA.setIndexProgress(this.pids.length);
        PIXCRAWL_DATA.getSocket().send(JSON.stringify({
            type: 'index-total',
            value: this.pids.length,
        }));
        const pool = new AsyncPool(8);
        for (const pid of this.pids)
            await pool.submit(Retrial.retry, IndexHandler.getPictureInfo, pid);
        await pool.close();
        LOGGER.ok(`Index complete: ${PIXCRAWL_DATA.getIndexData().count}/${PIXCRAWL_DATA.getIndexData().total}`);
    }

    /** This function contains an inner try-catch block that may possibly bypass the retrial. */
    private static async getPictureInfo(pid: string) {
        const pictures = [];
        try {
            const response = await axios.get(`https://www.pixiv.net/ajax/illust/${pid}?lang=zh`, {
                httpsAgent: PROXY,
                headers: HEADERS
            });
            const data = response.data.body;
            const pages = data.pageCount;
            const baseUrl = data.urls.original;
            const title = data.title;
            const uid = data.userId;
            const uname = data.userName;
            const tags = [];
            for (const tag of data.tags.tags) {
                tags.push({
                    tag: decodeURI(tag.tag),
                    translation: tag.translation ? decodeURI(tag.translation.en) : null,
                });
            }
            for (let i = 0; i < pages; i++) {
                const url = baseUrl.replace('_p0', `_p${i}`);
                pictures.push({
                    pid: pid,
                    title: title,
                    index: i,
                    url: url,
                    tags: tags,
                    uid: uid,
                    uname: uname
                });
            }
            const result = {
                type: 'index',
                value: pictures,
            };
            PIXCRAWL_DATA.addIndexResults(result);
            PIXCRAWL_DATA.addIndexProgress();
            PIXCRAWL_DATA.getSocket().send(JSON.stringify(result));
            await System.sleep(SYSTEM_SETTINGS.submitDelay);
        } catch (e: any) {
            if (e.response) {
                LOGGER.warn(`${pid} is not reachable`);
                PIXCRAWL_DATA.decrIndexTotal();
                PIXCRAWL_DATA.getSocket().send(JSON.stringify({ type: 'index-decrease' }));
                return;
            }
        }
    }
}