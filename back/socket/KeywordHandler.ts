import axios from "axios";
import * as jsdom from "jsdom";
import { Keyword, PIXCRAWL_DATA } from "../src/pixcrawl.js";
import { AsyncPool } from "../utils/AsyncPool.js";
import { Downloader } from "../utils/Downloader.js";
import { logfcall, LOGGER } from "../utils/Logger.js";
import { Retrial } from "../utils/Retrial.js";
import { HEADERS, PROXY } from "../utils/System.js";
import { BaseHandler } from "./BaseHandler.js";
import { Socket } from "./Socket.js";

export class KeywordHandler extends BaseHandler {
    private keywords: { type: string; value: string }[];

    public constructor(
        keywords: { type: string; value: string }[],
        socket: Socket
    ) {
        super(socket);
        this.keywords = keywords;
    }

    @logfcall()
    public override async handle() {
        const pool = new AsyncPool(16);
        console.log(this.keywords);
        for (let i = 0; i < this.keywords.length; i++) {
            const keyword = this.keywords[i];
            switch (keyword.type) {
                case "uid":
                    await pool.submit(
                        Retrial.retry,
                        KeywordHandler.getUid,
                        keyword.value,
                        this.socket,
                        i
                    );
                    break;
                case "tag":
                    await pool.submit(
                        Retrial.retry,
                        KeywordHandler.getTag,
                        keyword.value,
                        this.socket,
                        i
                    );
                    break;
            }
        }
        await pool.close();
        this.socket.broadcast(
            JSON.stringify({
                type: "search-complete",
            })
        );
        LOGGER.ok("Search complete");
    }

    @logfcall() private static async getUid(
        uid: string,
        socket: Socket,
        index: number
    ) {
        // user-profile-all
        const response = await axios.get(
            `https://www.pixiv.net/ajax/user/${uid}/profile/all`,
            {
                httpsAgent: PROXY,
            }
        );
        const data = response.data;
        const top = data.body.pickup[0];
        const name = decodeURI(top.userName);
        let thumbnail = null;
        if (top.userImageUrl)
            thumbnail = await new Downloader(top.userImageUrl).download();
        const pictures = Object.keys(data.body.illusts).map((pid) => {
            return { pid: pid };
        });
        const result = {
            type: "uid",
            index: index,
            value: uid,
            uid: uid,
            uname: name,
            avatar: thumbnail,
            pictures: pictures,
        };
        PIXCRAWL_DATA.setKeyword(index, result);
        PIXCRAWL_DATA.addSearchProgress();
        socket.broadcast(JSON.stringify(result));
    }

    @logfcall() private static async getTag(
        tag: string,
        socket: Socket,
        index: number
    ) {
        // pixiv navirank
        const response = await axios.get(
            `https://pixiv.navirank.com/tag/${encodeURI(tag)}`,
            {
                httpsAgent: PROXY,
                headers: HEADERS,
            }
        );
        const html = new jsdom.JSDOM(response.data).window.document;
        const pictureElements = html.querySelectorAll(
            `ul[class='irank'] li[class='img'] >a`
        );
        const result: Keyword = {
            type: "tag",
            index: index,
            value: tag,
            pictures: [],
        };
        let i = 0;
        const getNavirankPicture = async function (pid: string) {
            const url = `https://pixiv.navirank.com/img/${pid.slice(
                0,
                3
            )}/${pid}.jpg`;
            return await new Downloader(url).download();
        };
        for (const element of pictureElements) {
            const href = element.getAttribute("href");
            if (!href) continue;
            const pid = href.slice(4, -1);
            result.pictures.push({ pid: pid });
            if (i == 0) result.avatar = await getNavirankPicture(pid);
            i++;
        }
        PIXCRAWL_DATA.setKeyword(index, result);
        PIXCRAWL_DATA.addSearchProgress();
        socket.broadcast(JSON.stringify(result));
    }
}
