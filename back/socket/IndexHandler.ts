import axios from "axios";
import { AsyncPool } from "../utils/AsyncPool.js";
import { Retrial } from "../utils/Retrial.js";
import { PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { HEADERS, PROXY, System, SYSTEM_SETTINGS } from "../utils/System.js";
import { BaseHandler } from "./BaseHandler.js";
import { Socket } from "./Socket.js";

/**
 * Directly gets pids from `PIXCRAWL_DATA`.
 * Unreachable pictures are those who do not have a url.
 */
export class IndexHandler extends BaseHandler {
    public constructor(socket: Socket) {
        super(socket);
    }

    @logfcall() public async handle() {
        const pool = new AsyncPool(8);
        for (let i = 0; i < PIXCRAWL_DATA.getLength(); i++) {
            const keyword = PIXCRAWL_DATA.getKeyword(i);
            for (let j = 0; j < keyword.pictures.length; j++) {
                const picture = keyword.pictures[j];
                await pool.submit(
                    Retrial.retry,
                    IndexHandler.getPictureInfo,
                    picture.pid,
                    i,
                    j,
                    this.socket
                );
            }
        }
        await pool.close();
        this.socket.broadcast(JSON.stringify({ type: "index-complete" }));
    }

    /** This function contains an inner try-catch block that may bypass the retrial. */
    @logfcall() private static async getPictureInfo(
        pid: string,
        keywordIndex: number,
        pictureIndex: number,
        socket: Socket
    ) {
        try {
            const response = await axios.get(
                `https://www.pixiv.net/ajax/illust/${pid}?lang=zh`,
                {
                    httpsAgent: PROXY,
                    headers: HEADERS,
                }
            );
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
                    translation: tag.translation
                        ? decodeURI(tag.translation.en)
                        : undefined,
                });
            }
            PIXCRAWL_DATA.setPicture(keywordIndex, pictureIndex, {
                pid: pid,
                title: title,
                index: pages,
                url: baseUrl,
                tags: tags,
                uid: uid,
                uname: uname,
            });
            const result = {
                type: "index",
                index: keywordIndex,
                total: pages,
            };
            socket.broadcast(JSON.stringify(result));
            PIXCRAWL_DATA.addIndexProgress();
            await System.sleep(SYSTEM_SETTINGS.submitDelay);
        } catch (e: any) {
            if (e.response) {
                LOGGER.warn(`${pid} is not reachable`);
                socket.broadcast(
                    JSON.stringify({
                        type: "index-decr",
                        index: keywordIndex,
                    })
                );
                PIXCRAWL_DATA.decreaseIndexTotal();
                return;
            }
        } finally {
            LOGGER.info(
                `${PIXCRAWL_DATA.getIndexProgress()}/${PIXCRAWL_DATA.getIndexTotal()}`
            );
        }
    }
}
