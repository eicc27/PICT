import axios from 'axios';
import httpsProxyAgent from 'https-proxy-agent';
import * as jsdom from 'jsdom';
import { PIXCRAWL_DATA } from '../src/pixcrawl.js';
import { AsyncPool } from '../utils/AsyncPool.js';
import { Downloader } from '../utils/Downloader.js';
import { logfcall, LOGGER } from '../utils/Logger.js';
import { Retrial } from '../utils/Retrial.js';
import { HEADERS, PROXY, SYSTEM_SETTINGS } from '../utils/System.js';


export class KeywordHandler {
    private keywords: { type: string, value: string }[];

    public constructor(keywords: { type: string, value: string }[]) {
        this.keywords = keywords;
    }

    @logfcall() public async handle() {
        PIXCRAWL_DATA.setSearchProgress(this.keywords.length);
        PIXCRAWL_DATA.getSocket().send(JSON.stringify({
            type: 'keyword-total',
            value: this.keywords.length,
        }));
        const pool = new AsyncPool(16);
        console.log(this.keywords.length);
        for (const keyword of this.keywords) {
            switch (keyword.type) {
                case 'uid':
                    await pool.submit(Retrial.retry, KeywordHandler.getUid, keyword.value);
                    break;
                case 'tag':
                    await pool.submit(Retrial.retry, KeywordHandler.getTag, keyword.value);
                    break;
            }
        }
        await pool.close();
        LOGGER.ok('Search complete');
    }

    @logfcall() private static async getUid(uid: string) {
        // user-profile-all
        const response = await axios.get(`https://www.pixiv.net/ajax/user/${uid}/profile/all`, {
            httpsAgent: PROXY
        });
        const data = response.data;
        const top = data.body.pickup[0];
        const name = decodeURI(top.userName);
        let thumbnail = null;
        if (top.userImageUrl)
            thumbnail = await new Downloader(top.userImageUrl).download();
        const pictures = Object.keys(data.body.illusts);
        const result: { type: 'uid', value: { uid: string, thumbnail: Buffer, name: string, pictures: string[] } } = {
            type: 'uid',
            value: {
                uid: uid,
                thumbnail: thumbnail,
                name: name,
                pictures: pictures
            }
        };
        PIXCRAWL_DATA.addSearchResults(result);
        PIXCRAWL_DATA.addSearchProgress();
        PIXCRAWL_DATA.getSocket().send(JSON.stringify(result));
    }

    @logfcall() private static async getTag(tag: string) {
        // pixiv navirank
        const response = await axios.get(`https://pixiv.navirank.com/tag/${encodeURI(tag)}`, {
            httpsAgent: PROXY,
            headers: HEADERS
        });
        const html = new jsdom.JSDOM(response.data).window.document;
        const pictureElements = html.querySelectorAll(`ul[class='irank'] li[class='img'] >a`);
        const result: { type: 'tag', value: { tag: string, pictures: string[] } } = {
            type: 'tag', value: { tag: tag, pictures: [] }
        };
        for (const element of pictureElements) {
            const href = element.getAttribute('href');
            if (!href) continue;
            result.value.pictures.push(href.slice(4, -1));
        }
        PIXCRAWL_DATA.addSearchResults(result);
        PIXCRAWL_DATA.addSearchProgress();
        PIXCRAWL_DATA.getSocket().send(JSON.stringify(result));
    }
}