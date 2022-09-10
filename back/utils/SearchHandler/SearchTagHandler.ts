import axios from "axios";
import { ENV, RESULT } from "../../config/environment";
import Logger, { axiosErrorLogger, axiosResponseLogger, SigLevel } from "../Logger";
import ISearchHandler from "./ISearchHandler";
import SearchPIDHandler from "./SearchPIDHandler";

class TagSearchResult {
    result: RESULT;
    extended?: boolean = false;
    index?: number;
    searchCnt?: number = 0;
    value?: {
        tag: string,
        translation: string,
        avatar?: string
    }[];
}


class ExtendedTagSearchResult {
    result: RESULT;
    extended?: boolean = true;
    tag?: string;
    translation?: string;
    index?: number;
    avatar?: string;
}

/**
 * WARNING: Now only supports `zh` searching.
 */
export default class SearchTagHandler implements ISearchHandler {
    public keyword: string;

    public constructor(tag: string) {
        this.keyword = tag;
    }

    public async search(): Promise<TagSearchResult> {
        return new Promise((resolve) => {
            if (ENV.PLATFORM == 'win32' && !ENV.PROXY_AGENT) {
                (new Logger('No system proxy settings detected on Windows!', SigLevel.error)).log();
                resolve({ result: RESULT.FAILED });
                return;
            }
            axios.get(ENV.PIXIV.USER.TAG(this.keyword), { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => {
                    axiosResponseLogger(ENV.PIXIV.USER.TAG(this.keyword));
                    let retVal: TagSearchResult = {
                        extended: false,
                        result: RESULT.SUCCESS,
                        value: []
                    }
                    let directResult = await this.extendedSearch();
                    retVal.value.push({
                        tag: directResult.tag,
                        translation: directResult.translation,
                        avatar: directResult.avatar,
                    });
                    // zh
                    let tagData = resp.data.body.tagTranslation;
                    let avatarResult = await this.extendedSearch();
                    if (avatarResult.result != RESULT.SUCCESS) {
                        resolve({ result: RESULT.FAILED }); return;
                    }
                    let keys = Object.keys(tagData);
                    let values: any[] = Object.values(tagData);
                    for (let i = 0; i < keys.length; i++) {
                        let skip = false;
                        for (let j = 0; j < retVal.value.length; j++) {
                            if (retVal.value[j].tag == keys[i])
                                skip = true;
                        }
                        if (skip) continue;
                        retVal.value.push(
                            {
                                tag: keys[i],
                                translation: values[i].zh
                            }
                        );
                    }
                    resolve(retVal);
                }, (error) => {
                    axiosErrorLogger(error, ENV.PIXIV.USER.TAG(this.keyword));
                    resolve({ result: RESULT.FAILED });
                });
        });
    }

    public async extendedSearch(): Promise<ExtendedTagSearchResult> {
        return new Promise((resolve) => {
            if (ENV.PLATFORM == 'win32' && !ENV.PROXY_AGENT) {
                (new Logger('No system proxy settings detected on Windows!', SigLevel.error)).log();
                resolve({ result: RESULT.FAILED });
                return;
            }
            axios.get(ENV.PIXIV.USER.TAG_PICTURE(this.keyword), { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => {
                    axiosResponseLogger(ENV.PIXIV.USER.TAG_PICTURE(this.keyword));
                    let tag = resp.data.body.tag;
                    let avatarUrl = resp.data.body.pixpedia.image;
                    let tagTranslation: any = Object.values(resp.data.body.tagTranslation)[0];
                    let translation: string;
                    // console.log(tagTranslation);
                    if (tagTranslation) {
                        if ("zh" in tagTranslation) { translation = tagTranslation.zh; }
                        else if ("en" in tagTranslation) { translation = tagTranslation.en; }
                    }
                    let avatar: string;
                    if (avatarUrl) {
                        avatar = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
                    } else {
                        let avatarId = resp.data.body.pixpedia.id;
                        if (avatarId)
                            avatar = (await (new SearchPIDHandler(avatarId)).search()).avatar;
                    }
                    resolve({
                        result: RESULT.SUCCESS,
                        extended: true,
                        avatar: avatar,
                        translation: translation,
                        tag: tag,
                    });
                }, (error) => {
                    axiosErrorLogger(error, ENV.PIXIV.USER.TAG_PICTURE(this.keyword));
                    resolve({ result: RESULT.FAILED });
                });
        });
    }
}