import { WebSocket } from 'ws';
import AsyncPool from './AsyncPool';
import SearchUIDHandler from './SearchHandler/SearchUIDHandler';
import { RequestType, REQUEST_TYPE, KeywordType, KEYWORD_TYPE } from '../types/Types';
import SearchUnameHandler from './SearchHandler/SearchUnameHandler';
import SearchTagHandler from './SearchHandler/SearchTagHandler';

/**
 * Handles WebSocket requests from front-end.
 * 
 * 
 * Asynchronously searches keywords. For keywords that needs browser automation,
 * they're searched synchronously(like `uname`).
 */
export default class PixcrawlWSHandler {
    private data: RequestType;
    private ws: WebSocket;
    private searchCnt = 0;

    constructor(msg: any, ws: WebSocket) {
        this.data = msg;
        this.ws = ws;
    }

    public async handle() {
        switch (this.data.type) {
            case REQUEST_TYPE.search:
                return await this.search();
            case REQUEST_TYPE.extendedSearch:
                return await this.extendedSearch();
        }
    }

    private async search() {
        // http://127.0.0.1/32345
        // let settings = await getProxySettings(); 
        // this.ws.send(`proxy settings: ${settings.https}`);
        this.searchCnt = 0;
        let pool = new AsyncPool(4);
        let kwds = this.data.value;
        for (let i = 0; i < kwds.length; i++) {
            let kwd = kwds[i];
            switch (kwd.type) {
                case KEYWORD_TYPE.UID:
                    await pool.submit(this.searchForUid(kwd.value, kwd.index));
                    break;
                case KEYWORD_TYPE.UNAME:
                    await this.searchForUname(kwd.value, kwd.index);
                    break;
                case KEYWORD_TYPE.TAG:
                    await pool.submit(this.searchForTag(kwd.value, kwd.index));
                    break;
            }
        }
        await pool.close();
    }

    private async extendedSearch() {
        let kwd: any = this.data.value;
        switch (kwd.type) {
            case KEYWORD_TYPE.UID:
                return await this.searchForUidExt(kwd.value, kwd.index);
            case KEYWORD_TYPE.UNAME:
                return await this.searchForUnameExt(kwd.value, kwd.index);
            case KEYWORD_TYPE.TAG:
                return await this.searchForTagExt(kwd.value, kwd.index);
        }
    }

    private async searchForUid(value: string, index: number) {
        let handler = new SearchUIDHandler(value);
        let search = await handler.search();
        search.index = index;
        search.searchCnt = ++this.searchCnt;
        // console.log(search);
        this.ws.send(JSON.stringify({ value: search, type: 'search-uid' }));
    }

    private async searchForUidExt(value: string, index: number) {
        let handler = new SearchUIDHandler(value);
        let searchExt = await handler.extendedSearch();
        searchExt.index = index;
        // console.log(searchExt);
        this.ws.send(JSON.stringify({ value: searchExt, type: 'search-uid' }))
    }

    private async searchForUname(value: string, index: number) {
        let handler = new SearchUnameHandler(value);
        let search = await handler.search();
        search.index = index;
        search.searchCnt = ++this.searchCnt;
        this.ws.send(JSON.stringify({ value: search, type: 'search-uname' }));
    }

    private async searchForUnameExt(value: string, index: number) {
        let handler = new SearchUnameHandler(value);
        let searchExt = await handler.extendedSearch();
        searchExt.index = index;
        this.ws.send(JSON.stringify({ value: searchExt, type: 'search-uname' }));
    }

    private async searchForTag(value: string, index: number) {
        let handler = new SearchTagHandler(value);
        let search = await handler.search();
        search.index = index;
        search.searchCnt = ++this.searchCnt;
        this.ws.send(JSON.stringify({ value: search, type: 'search-tag' }));
    }

    private async searchForTagExt(value: string, index: number) {
        let handler = new SearchTagHandler(value);
        let searchExt = await handler.extendedSearch();
        searchExt.index = index;
        this.ws.send(JSON.stringify({ value: searchExt, type: 'search-tag' }));
    }
}
