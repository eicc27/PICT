import axios from 'axios';
import httpsProxyAgent from 'https-proxy-agent';
import WebSocket from 'ws';
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
}