import axios from "axios";
import { ENV, RESULT } from "../../config/environment";
import ISearchHandler from "./ISearchHandler";

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
            axios.get(ENV.PIXIV.USER.TAG(this.keyword), { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => {
                    let retVal: TagSearchResult = {
                        extended: false,
                        result: RESULT.SUCCESS,
                        value: []
                    }
                    // zh
                    let tagData = resp.data.body.tagTranslation;
                    let avatarResult = await this.extendedSearch();
                    if (avatarResult.result != RESULT.SUCCESS) {
                        resolve({ result: RESULT.FAILED }); return;
                    }
                    let keys = Object.keys(tagData);
                    let values: any[] = Object.values(tagData);
                    for (let i = 0; i < keys.length; i++) {
                        if (!i) {
                            retVal.value.push(
                                {
                                    tag: keys[i],
                                    translation: values[i].zh,
                                    avatar: avatarResult.avatar
                                }
                            );
                        } else {
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
                    }
                    resolve(retVal);
                }, (error) => {
                    console.log(error);
                    resolve({ result:RESULT.FAILED });
                });
        });
    }

    public async extendedSearch(): Promise<ExtendedTagSearchResult> {
        return new Promise((resolve) => {
            axios.get(ENV.PIXIV.USER.TAG_PICTURE(this.keyword), { httpsAgent: ENV.PROXY_AGENT })
                .then(async (resp) => {
                    let avatarUrl = resp.data.body.pixpedia.image;
                    let avatar = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
                    resolve({
                        result: RESULT.SUCCESS,
                        extended: true,
                        avatar: avatar
                    });
                }, (error) => {
                    console.log(error);
                    resolve({ result: RESULT.FAILED });
                });
        });
    }
}