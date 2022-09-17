import axios from "axios";
import { ENV, RESULT } from "../../config/environment";
import { JSDOM } from 'jsdom';
import ISearchHandler from "./ISearchHandler";
import AsyncPool from "../AsyncPool";
import Logger, { axiosErrorLogger, axiosResponseLogger, SigLevel } from "../Logger";
import chalk from "chalk";

/**
 * When result is not `RESULT.SUCCESS`, the rest of the attributes are not provided.
 */
class UIDSearchResult {
    extended?: boolean = false;
    result: RESULT;
    value?: string;
    avatar?: string;
    index?: number;
    searchCnt?: number = 0;
}

export class ExtendedUIDSearchResult {
    extended?: boolean = true;
    result: RESULT;
    pictures?: {
        title: string
        content: string,
    }[];
    tags?: string[];
    index?: number;
}

/**
 * TODO: Add retrial.
 * 
 * Handler for User ID search. Does not need browser.
 * 
 * The preview pictures are automatically donwloaded asynchonously.
 */
export default class SearchUIDHandler implements ISearchHandler {

    public keyword: string;

    public constructor(uid: string) {
        this.keyword = uid;
    }

    /**
     * Search for user name and user avatar(in base64)
     */
    public async search(): Promise<UIDSearchResult> {
        return new Promise((resolve) => {
            axios.get(`https://www.pixiv.net/users/${this.keyword}`,
                { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                .then(async (resp) => { // on success
                    axiosResponseLogger(`https://www.pixiv.net/users/${this.keyword}`);
                    let html = new JSDOM(resp.data).window.document;
                    // gets user name and user avatar through json-encoded string
                    let userInfo = JSON.parse(html.getElementById("meta-preload-data")
                        .getAttribute('content'));
                    userInfo = Object.values(userInfo.user)[0];
                    let userName: string = userInfo.name;
                    let avatarUrl = userInfo.image;
                    let avatarBase64 = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
                    resolve({
                        extended: false,
                        result: RESULT.SUCCESS,
                        value: userName,
                        avatar: avatarBase64
                    });
                }, (error) => { // on error
                    axiosErrorLogger(error, `https://www.pixiv.net/users/${this.keyword}`);
                    resolve({
                        result: RESULT.FAILED
                    });
                });
        });
    }

    /**
     * Search for user top 3(if has) thumbnails(in base64, 250*250) and tags
     */
    public async extendedSearch(): Promise<ExtendedUIDSearchResult> {
        return new Promise((resolve) => {
            axios.get(ENV.PIXIV.USER.TOP(this.keyword), { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                .then(async (resp) => {
                    axiosResponseLogger(ENV.PIXIV.USER.TOP(this.keyword));
                    let retVal: ExtendedUIDSearchResult = {
                        extended: true,
                        result: RESULT.SUCCESS,
                        pictures: [],
                        tags: []
                    };
                    // the data passed through is already JSON.
                    // Gets TOP ${MAXNUM} numbers of thumbnails
                    let pictureData: any[] = Object.values(resp.data
                        .body.illusts);
                    let pool = new AsyncPool(3);
                    for (let i = 0; i < Math.min(pictureData.length, ENV.MAX_PREVIEW_NUM); i++) {
                        await pool.submit((async (retVal: ExtendedUIDSearchResult) => {
                            let thumbnailTitle = pictureData[i].title;
                            let thumbnailUrl = pictureData[i].url;
                            let thumbnailBase64 = await ENV.PIXIV.PICTURE_GETTER(thumbnailUrl);
                            retVal.pictures.push(
                                {
                                    title: thumbnailTitle,
                                    content: thumbnailBase64,
                                }
                            );
                            // Gets tags in featured pictures
                            let tags = pictureData[i].tags;
                            for (let i = 0; i < tags.length; i++) {
                                let tag = tags[i];
                                if (retVal.tags.includes(tag)) continue;
                                retVal.tags.push(tag);
                            }
                        })(retVal));
                    }
                    await pool.close();
                    resolve(retVal);
                }, (error) => {
                    axiosErrorLogger(error, ENV.PIXIV.USER.TOP(this.keyword));
                    resolve({
                        result: RESULT.FAILED
                    });
                }
                );
        })
    }

    public async searchWithoutAvatar(): Promise<UIDSearchResult> {
        for (let retrial = 0; retrial < ENV.SETTINGS.TIMEOUT; retrial++) {
            let ret: UIDSearchResult | number = await new Promise((resolve) => {
                axios.get(`https://www.pixiv.net/users/${this.keyword}`,
                    { httpsAgent: ENV.PROXY_AGENT, timeout: ENV.SETTINGS.TIMEOUT })
                    .then(async (resp) => { // on success
                        if (!retrial)
                            (new Logger(`Retrial #${chalk.yellowBright(retrial + 1)}`));
                        axiosResponseLogger(`https://www.pixiv.net/users/${this.keyword}`);
                        let html = new JSDOM(resp.data).window.document;
                        // gets user name and user avatar through json-encoded string
                        let userInfo = JSON.parse(html.getElementById("meta-preload-data")
                            .getAttribute('content'));
                        userInfo = Object.values(userInfo.user)[0];
                        let userName: string = userInfo.name;
                        resolve({
                            extended: false,
                            result: RESULT.SUCCESS,
                            value: userName,
                        });
                    }, async (error) => { // on error
                        axiosErrorLogger(error, `https://www.pixiv.net/users/${this.keyword}`, retrial);
                        let isPageNotFound: boolean = error.response && error.response.status;
                        if (!isPageNotFound && retrial < ENV.SETTINGS.MAX_RETRIAL)
                            resolve(retrial);
                        else
                            resolve({
                                result: RESULT.FAILED
                            });
                    });
            });
            if (typeof ret != 'number') {
                return ret;
            }
        }
        (new Logger(`Max retrial acheived for https://www.pixiv.net/users/${this.keyword}`, SigLevel.error)).log();
    }
}
