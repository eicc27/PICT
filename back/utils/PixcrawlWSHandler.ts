import { WebSocket } from 'ws';
import AsyncPool from './AsyncPool';
import SearchUIDHandler from './SearchHandler/SearchUIDHandler';
import { RequestType, REQUEST_TYPE, KEYWORD_TYPE, ExtendedRequestType, Picture } from '../types/Types';
import SearchUnameHandler from './SearchHandler/SearchUnameHandler';
import SearchTagHandler from './SearchHandler/SearchTagHandler';
import SearchPIDHandler from './SearchHandler/SearchPIDHandler';
import Logger, { SigLevel } from './Logger';
import chalk from 'chalk';
import CrawlUIDHandler from './CrawlHandler/CrawlUIDHandler';
import CrawlTagHandler from './CrawlHandler/CrawlTagHandler';
import SQLiteConnector, { SQLColumnType } from './DBConnector/SQLiteConnector';
import { ENV } from '../config/environment';
import DataParser from './DownloadHandler/DataParser';
import Timer from './Timer';
import AsyncDownloader from './DownloadHandler/AsyncDownloader';


/**
 * Handles WebSocket requests from front-end.
 * 
 * 
 * Asynchronously searches keywords. For keywords that needs browser automation,
 * they're searched synchronously(like `uname`).
 */
export default class PixcrawlWSHandler {
    private data: RequestType | ExtendedRequestType;
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
            case REQUEST_TYPE.crawl:
                return await this.crawl();
            case REQUEST_TYPE.download:
                return await this.download();
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
            (new Logger(`Recieved: Search request of ${chalk.blueBright(`${kwd.type}: ${kwd.value}`)}`)).log();
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
                case KEYWORD_TYPE.PID:
                    await pool.submit(this.searchForPid(kwd.value, kwd.index));
                    break;
            }
        }
        await pool.close();
    }

    private async extendedSearch() {
        let kwd: any = this.data.value;
        (new Logger(`Recieved: Extended search request of ${chalk.blueBright(`${kwd.type}: ${kwd.value}`)}`)).log();
        switch (kwd.type) {
            case KEYWORD_TYPE.UID:
                return await this.searchForUidExt(kwd.value, kwd.index);
            case KEYWORD_TYPE.UNAME:
                return await this.searchForUnameExt(kwd.value, kwd.index);
            case KEYWORD_TYPE.TAG:
                return await this.searchForTagExt(kwd.value, kwd.index);
            case KEYWORD_TYPE.PID:
                return await this.searchForPidExt(kwd.value, kwd.index);
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

    private async searchForPid(value: string, index: number) {
        let handler = new SearchPIDHandler(value);
        let search = await handler.search();
        search.index = index;
        search.searchCnt = ++this.searchCnt;
        this.ws.send(JSON.stringify({ value: search, type: 'search-pid' }));
    }

    private async searchForPidExt(value: string, index: number) {
        let handler = new SearchPIDHandler(value);
        let searchExt = await handler.extendedSearch();
        searchExt.index = index;
        this.ws.send(JSON.stringify({ value: searchExt, type: 'search-pid' }));
    }

    private async crawl() {
        // console.log('crawling...')
        let searchResults = this.data.value.searchResults;
        let keywords = this.data.value.keywords;
        let kwd: string;
        let uname: string;
        let pool = new AsyncPool(4);
        for (let i = 0; i < searchResults.length; i++) {
            let searchResult = searchResults[i];
            let keyword = keywords[i];
            switch (keyword.type) {
                case KEYWORD_TYPE.UID:
                    kwd = keyword.value;
                    uname = searchResult.uname;
                    await pool.submit(this.crawlUID(kwd, uname, i));
                    break;
                case KEYWORD_TYPE.UNAME:
                    kwd = searchResult.value[0].uid;
                    uname = keyword.value;
                    await pool.submit(this.crawlUID(kwd, uname, i));
                    break;
                case KEYWORD_TYPE.PID:
                    kwd = searchResult.author.uid;
                    uname = searchResult.author.uname;
                    await pool.submit(this.crawlUID(kwd, uname, i));
                    break;
                case KEYWORD_TYPE.TAG:
                    kwd = searchResult.value[0].tag;
                    await pool.submit(this.crawlTag(kwd, i));
                    break;
            }
        }
        await pool.close();
    }

    private async crawlUID(kwd: string, uname: string, index: number) {
        let crawlHandler = new CrawlUIDHandler(kwd, uname);
        let crawl = await crawlHandler.crawl();
        crawl.index = index;
        this.ws.send(JSON.stringify({ value: crawl, type: 'crawl-uid' }));
    }

    private async crawlTag(kwd: string, index: number) {
        let crawlHandler = new CrawlTagHandler(kwd);
        let crawl = await crawlHandler.crawl();
        crawl.index = index;
        this.ws.send(JSON.stringify({ value: crawl, type: 'crawl-tag' }));
    }

    private async download() {
        // constantly sends message to front end.
        let connection = new SQLiteConnector('PID', 'pixcrawl');
        let timeout = 10;
        let pictures: Picture[] = [];
        for (const val of this.data.value) {
            let value: Picture[] = val.pics;
            pictures = pictures.concat(value);
        }
        await (new AsyncDownloader(pictures, this.ws, ENV.SETTINGS.BLOB_SIZE)).download();
    }
}
