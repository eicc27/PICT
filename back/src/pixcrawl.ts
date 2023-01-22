import WebSocket from "ws";
import { logfcall, LOGGER } from "../utils/Logger.js";

type Type = 'pid' | 'uid' | 'tag' | 'uname';

type Progress = 'keyword' | 'search' | 'index' | 'download';

type Keyword = {
    type: Type,
    value: string
};

type Tag = {
    tag: string,
    translation: string | null,
}

export type Picture = {
    pid: string,
    title: string,
    index: number,
    url: string,
    tags: Tag[],
    uid: string,
    uname: string
}

type UidSearchResult = {
    type: 'uid',
    value: {
        uid: string,
        thumbnail: Buffer,
        name: string,
        pictures: string[]
    }
};

type TagSearchResult = {
    type: 'tag',
    value: {
        tag: string,
        pictures: string[]
    }
}

type IndexResult = {
    type: string,
    value: Picture[]
}

class PixcrawlData {
    private keywords: Keyword[] = [];
    private searchResults: (UidSearchResult | TagSearchResult)[] = [];
    private indexResults: IndexResult[] = []
    private searchData = {
        total: 0,
        count: 0,
        searchResults: this.searchResults
    };
    private indexData = {
        total: 0,
        count: 0,
        indexResults: this.indexResults,
    };
    private downloadData = {
        total: 0,
        count: 0
    }
    private progress: Progress = 'keyword';
    private socket: WebSocket | null = null;

    @logfcall() public clearKeywords() {
        this.keywords.splice(0, this.keywords.length);
    }
    private clearSearchResults() {
        this.searchResults.splice(0, this.searchResults.length);
    }
    private clearIndexResults() {
        this.indexResults.splice(0, this.indexResults.length);
    }
    @logfcall() public resetSearchData() {
        this.searchData.total = 0;
        this.searchData.count = 0;
        this.clearSearchResults();
    }
    @logfcall() public resetIndexData() {
        this.indexData.total = 0;
        this.indexData.count = 0;
        this.clearIndexResults();
    }
    @logfcall() public resetDownloadData() {
        this.downloadData.total = 0;
        this.downloadData.count = 0;
    }
    @logfcall() public setProgress(progress: Progress) {
        this.progress = progress;
    }
    @logfcall() public setSocket(socket: WebSocket) {
        this.socket = socket;
    }
    @logfcall() public addKeywords(...keywords: Keyword[]) {
        this.keywords.push(...keywords);
    }
    @logfcall() public addSearchResults(...searchResults: (UidSearchResult | TagSearchResult)[]) {
        this.searchResults.push(...searchResults);
    }
    @logfcall() public addIndexResults(...indexResults: IndexResult[]) {
        this.indexResults.push(...indexResults);
    }
    @logfcall() public addSearchProgress() {
        this.searchData.count++;
    }
    @logfcall() public setSearchProgress(total: number) {
        this.searchData.total = total;
    }
    @logfcall() public addIndexProgress() {
        this.indexData.count++;
    }
    @logfcall() public setIndexProgress(total: number) {
        this.indexData.total = total;
    }
    @logfcall() public addDownloadProgress() {
        this.downloadData.count++;
    }
    @logfcall() public setDownloadProgress(total: number) {
        this.downloadData.total = total;
    }
    @logfcall() public getProgress() {
        return this.progress;
    }
    @logfcall() public getKeywords() {
        return this.keywords;
    }
    @logfcall() public getSearchData() {
        return this.searchData;
    }
    @logfcall() public getIndexData() {
        return this.indexData;
    }
    @logfcall() public getDownloadData() {
        return this.downloadData;
    }
    @logfcall() public getSocket() {
        if (this.socket)
            return this.socket;
        else throw new EvalError('Socket not present');
    }
}

export const PIXCRAWL_DATA = new PixcrawlData();