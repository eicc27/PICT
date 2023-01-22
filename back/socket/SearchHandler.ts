import axios from 'axios';
import httpsProxyAgent from 'https-proxy-agent';
import * as jsdom from 'jsdom';
import { PIXCRAWL_DATA } from '../src/pixcrawl.js';
import { AsyncPool } from '../utils/AsyncPool.js';
import { Downloader } from '../utils/Downloader.js';
import { logfcall, LOGGER } from '../utils/Logger.js';
import { Retrial } from '../utils/Retrial.js';
import { SYSTEM_SETTINGS } from '../utils/System.js';


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
        for (const keyword of this.keywords) {
            switch (keyword.type) {
                case 'uid':
                    await pool.submit(Retrial.retry, SYSTEM_SETTINGS.retrial.times, SYSTEM_SETTINGS.retrial.timeout,
                        KeywordHandler.getUid, keyword.value);
                case 'tag':
                    await pool.submit(Retrial.retry, SYSTEM_SETTINGS.retrial.times, SYSTEM_SETTINGS.retrial.timeout,
                        KeywordHandler.getTag, keyword.value);
            }
        }
        await pool.close();
        LOGGER.ok('Search complete');
    }

    private static async getUid(uid: string) {
        // user-profile-all
        const response = await axios.get(`https://www.pixiv.net/ajax/user/${uid}/profile/all`, {
            httpsAgent: httpsProxyAgent({
                host: '127.0.0.1',
                port: SYSTEM_SETTINGS.proxyPort
            })
        });
        const data = response.data;
        const top = data.body.pickup[0];
        const name = decodeURI(top.userName);
        const thumbnail = await new Downloader(top.userImageUrl).download();
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

    private static async getTag(tag: string) {
        // pixiv navirank
        const response = await axios.get(`https://pixiv.navirank.com/tag/${encodeURI(tag)}/2023`, {
            httpsAgent: httpsProxyAgent({
                host: '127.0.0.1',
                port: SYSTEM_SETTINGS.proxyPort
            }),
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.55'
            }
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