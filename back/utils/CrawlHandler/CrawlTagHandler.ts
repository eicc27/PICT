import axios from "axios";
import { ENV, RESULT, TAGMODE } from "../../config/environment";
import ICrawlHander from "./ICrawlHandler";
import { JSDOM } from "jsdom";
import { CrawlResult } from "../../types/Types";
import SearchUIDHandler from "../SearchHandler/SearchUIDHandler";
import SearchPIDHandler from "../SearchHandler/SearchPIDHandler";
import Logger, { axiosErrorLogger, SigLevel } from "../Logger";
import AsyncPool from "../AsyncPool";
import chalk from "chalk";
import Timer from "../Timer";
import { WebSocket } from "ws";

export default class CrawlTagHandler implements ICrawlHander {
    public kwd: string;
    private ws: WebSocket;
    private index: number;

    public constructor(kwd: string, ws: WebSocket, index: number) {
        this.kwd = kwd;
        this.ws = ws;
        this.index = index;
    }

    public async crawl() {
        switch (ENV.PIXIV.TAG_MODE) {
            case TAGMODE.NAVIRANK:
                return (await this.crawlWithNavirank());
            case TAGMODE.PREMIUM:
                await this.crawlWithPremium();
                break;
        }
    }

    private async crawlWithNavirank(): Promise<CrawlResult> {
        for (let retrial = 0; retrial < ENV.SETTINGS.MAX_RETRIAL; retrial++) {
            let ret: CrawlResult | number = await new Promise((resolve) => {
                axios.get(ENV.NAVIRANK.TAG(this.kwd), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                    .then(async (resp) => {
                        let html = (new JSDOM(resp.data)).window.document;
                        let elements = html.querySelectorAll('ul[class="irank"]');
                        let pool = new AsyncPool(8);
                        let nums = Math.min(ENV.SETTINGS.TAG_CRED, elements.length);
                        this.ws.send(JSON.stringify({ type: 'crawl-total', value: nums }));
                        for (let i = 0; i < nums; i++) {
                            let element = elements[i];
                            if (!element.querySelector('li[class="type"]').innerHTML.includes('イラスト')) {
                                this.ws.send(JSON.stringify({ type: 'crawl-decr', value: this.index }));
                                continue;
                            }
                            await pool.submit(new Timer(10, 3).time((async (element) => {
                                let pidElement = element.querySelector('li[class="img"]>a');
                                let pid = pidElement.getAttribute('href').slice(4, -1);
                                let pidSearchResult = await (new SearchPIDHandler(pid)).searchWithoutAvatar();
                                if (pidSearchResult.result != RESULT.SUCCESS) {
                                    this.ws.send(JSON.stringify({ type: 'crawl-decr', value: this.index }));
                                    return;
                                }
                                let uidElement = element.querySelector('li[class="user_name"]>a');
                                let uid = uidElement.getAttribute('href').slice(6, -1);
                                let uname: any;
                                let originalUrls: any;
                                [uname, originalUrls] = await Promise.all([
                                    (new Timer(10, ENV.SETTINGS.MAX_RETRIAL)).time((new SearchUIDHandler(uid)).searchWithoutAvatar()),
                                    ENV.PIXIV.PID_GETTER(pid)
                                ]);
                                let pics = {
                                    pid: pid,
                                    uid: uid,
                                    pname: pidElement.getAttribute('title'),
                                    uname: uname.value,
                                    tags: pidSearchResult.tags,
                                    originalUrls: originalUrls,
                                };
                                this.ws.send(JSON.stringify({type: 'crawl-incr', value: { value: pics, index: this.index }}));
                                (new Logger(`index: ${i} / ${ENV.SETTINGS.TAG_CRED}`)).log();
                            })(element)));
                        }
                        await pool.close();
                        (new Logger(`Tag crawling of ${chalk.yellowBright(this.kwd)} completed.`,
                            SigLevel.ok)).log();
                        resolve({ result: RESULT.SUCCESS });
                    }, async (error) => {
                        axiosErrorLogger(error, ENV.NAVIRANK.TAG(this.kwd), retrial);
                        let isPageNotFound: boolean = error.response && error.response.status;
                        if (!isPageNotFound && retrial < ENV.SETTINGS.MAX_RETRIAL)
                            resolve(retrial);
                        else
                            resolve({ result: RESULT.FAILED });
                    });
            });
            if (typeof ret != "number")
                return ret;
        }
        (new Logger(`Max retrial achieved for ${ENV.NAVIRANK.TAG(this.kwd)}!`, SigLevel.error)).log();
    }

    private async crawlWithPremium() {
        // TODO
    }
}