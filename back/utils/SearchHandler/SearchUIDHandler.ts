import axios from "axios";
import { ENV, RESULT } from "../../config/environment";
import { JSDOM } from 'jsdom';
import ISearchHandler from "./ISearchHandler";

/**
 * When result is not `RESULT.SUCCESS`, the rest of the attributes are not provided.
 */
class UIDSearchResult {
    result: RESULT;
    uname?: string;
    avatar?: string;
    index?: number;
    searchCnt?: number = 0;
}

class ExtendedUIDSearchResult {
    result: RESULT;
    titles?: string[];
    pictures?: string[];
    tags?: string[];
    index?: number;
}

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
                { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => { // on success
                    let html = new JSDOM(resp.data).window.document;
                    // gets user name and user avatar through json-encoded string
                    let userInfo = JSON.parse(html.getElementById("meta-preload-data")
                        .getAttribute('content'));
                    userInfo = Object.values(userInfo.user)[0];
                    let userName: string = userInfo.name;
                    let avatarUrl = userInfo.image;
                    let avatarBase64 = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
                    resolve({
                        result: RESULT.SUCCESS,
                        uname: userName,
                        avatar: avatarBase64
                    });
                }, () => { // on error
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
            axios.get(ENV.PIXIV.USER.TOP(this.keyword), { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => {
                    let retVal: ExtendedUIDSearchResult = {
                        result: RESULT.SUCCESS,
                        titles: [],
                        pictures: [],
                    };
                    // the data passed through is already JSON.
                    // Gets TOP ${MAXNUM} numbers of thumbnails
                    let pictureData: any[] = Object.values(resp.data
                        .body.illusts);
                    for (let i = 0; i < pictureData.length; i++) {
                        let thumbnailTitle = pictureData[i].title;
                        let thumbnailUrl = pictureData[i].url;
                        let thumbnailBase64 = await ENV.PIXIV.PICTURE_GETTER(thumbnailUrl);
                        retVal.titles.push(thumbnailTitle);
                        retVal.pictures.push(thumbnailBase64);
                        if (i > 3) break;
                    }
                    // Gets tags in featured pictures
                    retVal.tags = await this.getTags();
                    resolve(retVal);
                }, () => {
                    resolve({
                        result: RESULT.FAILED
                    });
                }
                );
        })
    }

    private getTags(): Promise<string[]> {
        return new Promise((resolve) => {
            axios.get(ENV.PIXIV.USER.ALL(this.keyword), { httpsAgent: ENV.PROXY_AGENT })
                .then((resp) => {
                    let tags: string[] = [];
                    let pickupData: any[] = resp.data.body.pickup;
                    if (pickupData) {
                        for (const pickup of pickupData) {
                            if (!("id" in pickup)) continue;
                            let pickupTags = pickup.tags;
                            for (const tag of pickupTags) {
                                if (tags.includes(tag)) continue;
                                tags.push(tag);
                            }
                        }
                    }
                    resolve(tags);
                });
        });
    }
}
