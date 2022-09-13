import axios from "axios";
import chalk from "chalk";
import { ENV, RESULT } from "../../config/environment";
import { CrawlResult } from "../../types/Types";
import AsyncPool from "../AsyncPool";
import Logger, { axiosErrorLogger, axiosResponseLogger, SigLevel } from "../Logger";
import SearchPIDHandler from "../SearchHandler/SearchPIDHandler";
import ICrawlHander from "./ICrawlHandler";

export default class CrawlUIDHandler implements ICrawlHander {
    public kwd: string;
    public uname: string;

    public constructor(kwd: string, uname: string) {
        this.kwd = kwd;
        this.uname = uname;
    }

    public async crawl(retrial: number = 0): Promise<CrawlResult> {
        return new Promise((resolve) => {
            axios.get(ENV.PIXIV.USER.ALL(this.kwd), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                .then(async (resp) => {
                    if (!retrial)
                        (new Logger(`Retrial #${chalk.yellowBright(retrial + 1)}`));
                    axiosResponseLogger(ENV.PIXIV.USER.ALL(this.kwd));
                    let retVal: CrawlResult = {
                        result: RESULT.SUCCESS,
                        pics: [],
                    }
                    let allPics = resp.data.body.illusts;
                    let maxLen = Math.floor(allPics.length * ENV.SETTINGS.PIC_CRED);
                    let i = 0;
                    let ajaxRequestIds: string[] = [];
                    let pool = new AsyncPool(16);
                    for (const pid in allPics) {
                        if (++i > maxLen) break;
                        await pool.submit((async (ajaxRequestIds, retVal, pid) => {
                            ajaxRequestIds.push(`ids[]=${pid}`);
                            let originalUrls = await ENV.PIXIV.PID_GETTER(pid);
                            let searchResult = await (new SearchPIDHandler(pid)).searchWithoutAvatar();
                            retVal.pics.push({
                                pid: pid,
                                uid: this.kwd,
                                pname: searchResult.pname,
                                tags: searchResult.tags,
                                originalUrls: originalUrls,
                                uname: this.uname,
                            });
                        })(ajaxRequestIds, retVal, pid));
                    }
                    await pool.close();
                    (new Logger(`UID crawling of ${chalk.yellowBright(this.kwd)} completed. Total: ${chalk.yellowBright(retVal.pics.length)}`,
                        SigLevel.ok)).log();
                    resolve(retVal);
                }, async (error) => {
                    axiosErrorLogger(error, ENV.PIXIV.USER.ALL(this.kwd), retrial);
                    let isPageNotFound:boolean = error.response && error.response.status;
                    if (!isPageNotFound && retrial < ENV.SETTINGS.MAX_RETRIAL)
                        await this.crawl(++retrial);
                    else
                        resolve({ result: RESULT.FAILED });
                });
        });
    }
}