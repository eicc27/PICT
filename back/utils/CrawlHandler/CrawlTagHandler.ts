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

export default class CrawlTagHandler implements ICrawlHander {
    public kwd: string;

    public constructor(kwd: string) {
        this.kwd = kwd;
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

    private async crawlWithNavirank(retrial: number = 0): Promise<CrawlResult> {
        return new Promise((resolve) => {
            axios.get(ENV.NAVIRANK.TAG(this.kwd), { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => {
                    let retVal: CrawlResult = {
                        result: RESULT.SUCCESS,
                        pics: [],
                    }
                    let html = (new JSDOM(resp.data)).window.document;
                    let elements = html.querySelectorAll('ul[class="irank"]');
                    let i = 0;
                    let pool = new AsyncPool(16);
                    for (const element of elements) {
                        if (!element.querySelector('li[class="type"]').innerHTML.includes('イラスト'))
                            continue;
                        if (++i > ENV.SETTINGS.TAG_CRED) break;
                        await pool.submit((async (element, retVal) => {
                            let pidElement = element.querySelector('li[class="img"]>a');
                            let pid = pidElement.getAttribute('href').slice(4, -1);
                            let pidSearchResult = await (new SearchPIDHandler(pid)).searchWithoutAvatar();
                            if (pidSearchResult.result != RESULT.SUCCESS) return;
                            let uidElement = element.querySelector('li[class="user_name"]>a');
                            let uid = uidElement.getAttribute('href').slice(6, -1);
                            retVal.pics.push({
                                pid: pid,
                                uid: uid,
                                pname: pidElement.getAttribute('title'),
                                uname: (await (new SearchUIDHandler(uid)).searchWithoutAvatar()).value,
                                tags: pidSearchResult.tags,
                                originalUrls: await ENV.PIXIV.PID_GETTER(pid),
                            });
                        })(element, retVal));
                    }
                    await pool.close();
                    (new Logger(`Tag crawling of ${chalk.yellowBright(this.kwd)} completed. Total: ${chalk.yellowBright(retVal.pics.length)}`,
                        SigLevel.ok)).log();
                    resolve(retVal);
                }, async(error) => {
                    axiosErrorLogger(error, ENV.NAVIRANK.TAG(this.kwd), retrial);
                    let isPageNotFound:boolean = error.response && error.response.status;
                    if (!isPageNotFound && retrial < ENV.SETTINGS.MAX_RETRIAL)
                        await this.crawlWithNavirank(++retrial);
                    else
                        resolve({ result: RESULT.FAILED });
                });
        });
    }

    private async crawlWithPremium() {
        // TODO
    }
}