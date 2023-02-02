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
import { System, SYSTEM_SETTINGS } from "../utils/System.js";
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
            await pool.submit(Retrial.retry, SYSTEM_SETTINGS.retrial.times, SYSTEM_SETTINGS.retrial.timeout,
                IndexHandler.getPictureInfo, pid);
        await pool.close();
        LOGGER.ok(`Index complete: ${PIXCRAWL_DATA.getIndexData().count}/${PIXCRAWL_DATA.getIndexData().total}`);
    }

    /** This function contains an inner try-catch block that may possibly bypass the retrial. */
    private static async getPictureInfo(pid: string) {
        const pictures = [];
        try {
            const response = await axios.get(`https://www.pixiv.net/ajax/illust/${pid}?lang=zh`, {
                httpsAgent: httpsProxyAgent({
                    host: '127.0.0.1',
                    port: SYSTEM_SETTINGS.proxyPort,
                }),
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.55',
                    'cookie': 'first_visit_datetime_pc=2023-01-22+23%3A28%3A57; PHPSESSID=62269063_yUPPIWZzIyk6DUmIypkRS34zWzcEHh24; p_ab_id=0; p_ab_id_2=7; p_ab_d_id=1043231804; yuid_b=N1lzkkE; _ga_75BBYNYN9J=GS1.1.1675346462.5.0.1675346462.0.0.0; _ga=GA1.1.847096147.1674397745; __utma=235335808.847096147.1674397745.1674449837.1675346463.4; __utmz=235335808.1674397747.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmv=235335808.|2=login%20ever=no=1^3=plan=normal=1^5=gender=male=1^6=user_id=62269063=1^9=p_ab_id=0=1^10=p_ab_id_2=7=1^11=lang=zh=1; _ga_MZ1NL4PHH0=GS1.1.1674397750.1.1.1674397788.0.0.0; privacy_policy_agreement=5; device_token=0f7d554de238d06252e57c3d975b9fb1; c_type=25; privacy_policy_notification=0; a_type=0; b_type=1; _fbp=fb.1.1674397801010.2076687080; _im_vid=01GQCY5Z2D1R3K1XBCSW0WTMKW; cto_bundle=Jh1R_F9SY0NxUXFBa1ZiblB2QmxaU1JmcCUyQmpUNFgwOVVLekdxZms2MlJQVnUlMkJWZXlIVUZ1UE9MSk5Ha3dIJTJCQ241QyUyQlVCbWxSQk1TJTJCSm9YY2RXbTdCV25CWVczMGJYVEUlMkYlMkJyOWdTdnFTM1RnZWpteWNJUjNkQ3JLek5xbmElMkJyVTBlY2QwZmNCQWtyMHRtcXpIYmhneHQlMkZGNEElM0QlM0Q; __cf_bm=f_Pp_Ke5wL_p6H_VtZiXfl1cNt3k0sJug42ZbbADYsE-1675346458-0-AXMFPuAWabQbLtvOQaq+QL4VCamkUmS9v1+0PJzmU/8ln29HOq6bsiPzihBmO4GZ5AIzaXq2brTZh0evFdgkU/9k17jVLC+2vFNdkRex9J3dtywwi5iTSWu7STqu3uPWnCxPebY7TXswHc259rMsEksYQTPQyn/wvpo9iOHMQ38y7qbArrswj7QCSK0suygYkmNfQewSPI+PWhsvTHj0s7Y=; __utmb=235335808.1.10.1675346463; __utmc=235335808; __utmt=1'
                }
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
                if (e.response.status == 404) {
                    LOGGER.warn(`${pid} is no longer available`);
                    PIXCRAWL_DATA.getSocket().send(JSON.stringify({ type: 'index-decrease' }));
                    PIXCRAWL_DATA.decrIndexTotal();
                    return;
                } else if (e.response.status == 429) {
                    LOGGER.warn(`${pid}: recieved too many requests, and is blocked by Cloudflare. ${chalk.red('Aborted.')}`);
                    PIXCRAWL_DATA.getSocket().send(JSON.stringify({ type: 'index-decrease' }));
                    PIXCRAWL_DATA.decrIndexTotal();
                }
            }
        }
    }
}