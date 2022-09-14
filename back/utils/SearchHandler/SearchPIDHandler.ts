import axios from "axios";
import { ENV, RESULT } from "../../config/environment";
import ISearchHandler from "./ISearchHandler";
import { JSDOM } from 'jsdom';
import Logger, { axiosErrorLogger, axiosResponseLogger, SigLevel } from "../Logger";
import chalk from "chalk";

class PIDSearchResult {
    extended?: boolean = false;
    result: RESULT;
    avatar?: string;
    index?: number;
    searchCnt?: number = 0;
    tags?: string[];
    pname?: string;
    author?: {
        uname: string,
        uid: string,
        avatar?: string,
    };
}

class ExtendedPIDSearchResult {
    index?: number;
    extended?: boolean = true;
    result: RESULT;
    picture?: string;
}

export default class SearchPIDHandler implements ISearchHandler {
    public keyword: string;

    public constructor(pid: string) {
        this.keyword = pid;
    }

    /** Searches the picture 'avatar', picture name, author name & tags */
    public async search(): Promise<PIDSearchResult> {
        return new Promise(
            (resolve) => {
                axios.get(ENV.PIXIV.USER.PID(this.keyword), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                    .then(async (resp) => {
                        axiosResponseLogger(ENV.PIXIV.USER.PID(this.keyword));
                        let retVal: PIDSearchResult = {
                            extended: false,
                            result: RESULT.SUCCESS,
                        };
                        let html = resp.data;
                        let metaPreloadData = new JSDOM(html).window.document.getElementById('meta-preload-data');
                        let json = JSON.parse(metaPreloadData.getAttribute('content'));
                        let pictureInfo: any = Object.values(json.illust)[0];
                        retVal.pname = pictureInfo.illustTitle;
                        let avatarUrl = pictureInfo.urls.thumb;
                        retVal.avatar = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
                        let tags = [];
                        for (const tag of pictureInfo.tags.tags) tags.push(tag.tag);
                        retVal.tags = tags;
                        let userInfo: any = Object.values(json.user)[0];
                        retVal.author = {
                            uname: userInfo.name,
                            uid: userInfo.userId,
                            avatar: await ENV.PIXIV.PICTURE_GETTER(userInfo.image)
                        };
                        resolve(retVal);
                    }, (error) => {
                        axiosErrorLogger(error, ENV.PIXIV.USER.PID(this.keyword));
                        resolve({ result: RESULT.FAILED });
                    });
            }
        );
    }

    /** Searches the original picture itself */
    public async extendedSearch(): Promise<ExtendedPIDSearchResult> {
        return new Promise((resolve) => {
            axios.get(ENV.PIXIV.USER.PID(this.keyword), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                .then(async (resp) => {
                    axiosResponseLogger(ENV.PIXIV.USER.PID(this.keyword));
                    let html = resp.data;
                    let metaPreloadData = new JSDOM(html).window.document.getElementById('meta-preload-data');
                    let json = JSON.parse(metaPreloadData.getAttribute('content'));
                    let pictureInfo: any = Object.values(json.illust)[0];
                    let originalUrl = pictureInfo.urls.original;
                    // console.log(originalUrl);
                    let picture = await ENV.PIXIV.PICTURE_GETTER(originalUrl);
                    resolve({
                        result: RESULT.SUCCESS,
                        extended: true,
                        picture: picture,
                    });
                }, (error) => {
                    axiosErrorLogger(error, ENV.PIXIV.USER.PID(this.keyword));
                    resolve({ result: RESULT.FAILED });
                }
                );
        });
    }

    public async searchWithoutAvatar(retrial: number = 0): Promise<PIDSearchResult> {
        return new Promise(
            (resolve) => {
                axios.get(ENV.PIXIV.USER.PID(this.keyword), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                    .then(async (resp) => {
                        if (!retrial)
                            (new Logger(`Retrial #${chalk.yellowBright(retrial + 1)}`));
                        axiosResponseLogger(ENV.PIXIV.USER.PID(this.keyword));
                        let retVal: PIDSearchResult = {
                            extended: false,
                            result: RESULT.SUCCESS,
                        };
                        let html = resp.data;
                        let metaPreloadData = new JSDOM(html).window.document.getElementById('meta-preload-data');
                        let json = JSON.parse(metaPreloadData.getAttribute('content'));
                        let pictureInfo: any = Object.values(json.illust)[0];
                        retVal.pname = pictureInfo.illustTitle;
                        let tags = [];
                        for (const tag of pictureInfo.tags.tags) tags.push(tag.tag);
                        retVal.tags = tags;
                        let userInfo: any = Object.values(json.user)[0];
                        retVal.author = {
                            uname: userInfo.name,
                            uid: userInfo.userId,
                        };
                        resolve(retVal);
                    }, async (error) => {
                        axiosErrorLogger(error, ENV.PIXIV.USER.PID(this.keyword), retrial);
                        let isPageNotFound: boolean = error.response && error.response.status;
                        if (!isPageNotFound && retrial < ENV.SETTINGS.MAX_RETRIAL)
                            await this.searchWithoutAvatar(++retrial);
                        resolve({ result: RESULT.FAILED });
                    });
            }
        );
    }
}