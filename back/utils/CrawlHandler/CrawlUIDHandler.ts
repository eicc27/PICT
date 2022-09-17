import axios from "axios";
import chalk from "chalk";
import { WebSocket } from "ws";
import { ENV, RESULT } from "../../config/environment";
import { CrawlResult } from "../../types/Types";
import AsyncPool from "../AsyncPool";
import Logger, { axiosErrorLogger, axiosResponseLogger, SigLevel } from "../Logger";
import SearchPIDHandler from "../SearchHandler/SearchPIDHandler";
import Timer from "../Timer";
import ICrawlHander from "./ICrawlHandler";

export default class CrawlUIDHandler implements ICrawlHander {
    public kwd: string;
    public uname: string;
    private ws: WebSocket;
    private index: number;

    public constructor(kwd: string, uname: string, ws: WebSocket, index: number) {
        this.kwd = kwd;
        this.uname = uname;
        this.ws = ws;
        this.index = index;
    }

    public async crawl(): Promise<CrawlResult> {
        for (let retrial = 0; retrial < ENV.SETTINGS.MAX_RETRIAL; retrial++) {
            let res: number | CrawlResult = await new Promise((resolve) => {
                axios.get(ENV.PIXIV.USER.ALL(this.kwd), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                    .then(async (resp) => {
                        if (!retrial)
                            (new Logger(`Retrial #${chalk.yellowBright(retrial + 1)}`));
                        axiosResponseLogger(ENV.PIXIV.USER.ALL(this.kwd));
                        let allPics = Object.keys(resp.data.body.illusts);
                        let maxLen = Math.floor(allPics.length * ENV.SETTINGS.PIC_CRED);
                        this.ws.send(JSON.stringify({ value: maxLen, type: 'crawl-total' }));
                        let pool = new AsyncPool(8);
                        // the picture jsons are sorted(from newest to oldest)
                        for (let i = 0; i < maxLen; i++) {
                            await pool.submit((async (pid) => {
                                let searchResult: any;
                                let originalUrls: any;
                                [originalUrls, searchResult] = await Promise.all([
                                    (new Timer(10, ENV.SETTINGS.MAX_RETRIAL)).time(ENV.PIXIV.PID_GETTER(pid)),
                                    (new Timer(10, ENV.SETTINGS.MAX_RETRIAL)).time((new SearchPIDHandler(pid)).searchWithoutAvatar())
                                ]);
                                if (!originalUrls || !searchResult)
                                    return;
                                let retVal = {
                                    pid: pid,
                                    uid: this.kwd,
                                    pname: searchResult.pname,
                                    tags: searchResult.tags,
                                    originalUrls: originalUrls,
                                    uname: this.uname,
                                };
                                (new Logger(`index: ${i} / ${maxLen}`)).log();
                                this.ws.send(JSON.stringify({ value: { index: this.index, value: retVal }, type: 'crawl-incr' }));
                                return;
                            })(allPics[i]));
                        }
                        await pool.close();
                        (new Logger(`UID crawling of ${chalk.yellowBright(this.kwd)} completed.`,
                            SigLevel.ok)).log();
                        resolve({ result: RESULT.SUCCESS });
                    }, async (error) => {
                        axiosErrorLogger(error, ENV.PIXIV.USER.ALL(this.kwd), retrial);
                        let isPageNotFound: boolean = error.response && error.response.status;
                        if (!isPageNotFound && retrial < ENV.SETTINGS.MAX_RETRIAL)
                            resolve(retrial);
                        else
                            resolve({ result: RESULT.FAILED });
                    });
            });
            if (typeof res != 'number') { return res; }
        }
    }
}