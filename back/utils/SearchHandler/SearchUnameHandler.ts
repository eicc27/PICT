import ISearchHandler from "./ISearchHandler";
import { BrowserContext, firefox } from 'playwright';
import { ENV, RESULT } from "../../config/environment";
import SearchUIDHandler, { ExtendedUIDSearchResult } from "./SearchUIDHandler";
import AsyncPool from "../AsyncPool";
import Logger, { axiosResponseLogger, SigLevel } from "../Logger";

class UNameSearchResult {
    extended?: boolean = false;
    result: RESULT;
    index?: number;
    searchCnt?: number = 0;
    value?: {
        uname: string,
        uid: string,
        avatar: string
    }[]
}

type ExtendedUNameSearchResult = ExtendedUIDSearchResult;

/**
 * TODO: Let browser be constantly open during search period.
 * 
 * Handler for User Name search.
 * 
 * Needs browser for login. Each search reqeust is carried out synchronously.
 * 
 * Avatars are downloaded asynchronously.
 * 
 * 
 */
export default class SearchUnameHandler implements ISearchHandler {
    public keyword: string;

    public constructor(unameOrUID: string) {
        this.keyword = unameOrUID;
    }

    public async search(): Promise<UNameSearchResult> {
        let browser: BrowserContext;
        try {
            browser = await firefox.launchPersistentContext(ENV.BROWSER.USER_PROFILE);
        } catch (error) {
            (new Logger(`While launching headless browser: ${error}`, SigLevel.error));
            return { result: RESULT.FAILED };
        }
        let page = await browser.newPage();
        await page.goto(ENV.PIXIV.USER.UNAME(this.keyword), { waitUntil: 'domcontentloaded' });
        axiosResponseLogger(ENV.PIXIV.USER.UNAME(this.keyword));
        let users = await page.$$('ul[class="user-recommendation-items"]>li>a');
        (new Logger(`users list: ${users}`)).log();
        // if the result does not contain any user, the search is failed
        if (!users.length) {
            return { result: RESULT.FAILED };
        }
        let retVal: UNameSearchResult = {
            result: RESULT.SUCCESS,
            extended: false,
            value: [],
        };
        // the search results is INDEXED. Only avatars can get asynchronously.
        let resNum = Math.min(users.length, ENV.MAX_PREVIEW_NUM);
        for (let i = 0; i < resNum; i++) {
            let user = users[i];
            let uname = await user.getAttribute('title');
            let uid = (await user.getAttribute('href')).slice(('/users/'.length));
            retVal.value.push({
                uname: uname,
                uid: uid,
                avatar: null,
            });
        }
        let pool = new AsyncPool(3);
        for (let i = 0; i < resNum; i++) {
            let avatarUrl = await users[i].getAttribute('data-src');
            // await pool.submit((async (retVal, i, avatarUrl) => {
            //     let avatar = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
            //     retVal.value[i].avatar = avatar;
            // })(retVal, i, avatarUrl));
            let avatar = await ENV.PIXIV.PICTURE_GETTER(avatarUrl);
            retVal.value[i].avatar = avatar;
        }
        await pool.close();
        await browser.close();
        return retVal;
    }

    public async extendedSearch(): Promise<ExtendedUNameSearchResult> {
        return new SearchUIDHandler(this.keyword).extendedSearch();
    }
}