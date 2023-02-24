import WebSocket from "ws";
import { logfcall, LOGGER } from "../utils/Logger.js";

type Tag = {
    tag: string;
    translation?: string;
};

export type Picture = {
    pid: string;
    title?: string;
    uid?: string;
    uname?: string;
    index?: number;
    url?: string;
    tags?: Tag[];
};

export type Keyword = {
    type: string;
    value: string;
    index: number;
    uid?: string;
    uname?: string;
    avatar?: Buffer;
    pictures: Picture[];
};
class PixcrawlData {
    private keywords: Keyword[] = [];
    private searchProgress = 0;
    private indexProgress = 0;
    private indexDecr = 0;
    private downloadProgress = 0;

    public setKeywords(keywords: Keyword[]) {
        this.keywords.push(...keywords);
    }

    public clearKeywords() {
        this.keywords = [];
        this.searchProgress = 0;
        this.indexProgress = 0;
        this.indexDecr = 0;
        this.downloadProgress = 0;
    }

    public length() {
        return this.keywords.length;
    }

    public getPictureLength(available = true) {
        let count = 0;
        for (const keyword of this.keywords) {
            if (available)
                for (const picture of keyword.pictures) {
                    if (picture.index) count += picture.index;
                }
            else count += keyword.pictures.length;
        }
        return count;
    }

    public setKeyword(index: number, keyword: Keyword) {
        this.keywords[index] = keyword;
    }

    public addSearchProgress() {
        this.searchProgress++;
    }

    public getLength() {
        return this.keywords.length;
    }

    public getKeyword(index: number) {
        return this.keywords[index];
    }

    public setPicture(
        keywordIndex: number,
        pictureIndex: number,
        picture: Picture
    ) {
        this.keywords[keywordIndex].pictures[pictureIndex] = picture;
    }

    public addIndexProgress() {
        this.indexProgress++;
    }

    public decreaseIndexTotal() {
        this.indexDecr++;
    }

    public isIndexComplete() {
        return this.indexProgress + this.indexDecr == this.getPictureLength(false);
    }

    public getIndexTotal() {
        return this.getPictureLength(false) - this.indexDecr;
    }

    public getIndexProgress() {
        return this.indexProgress;
    }

    public getDownloadProgress() {
        return this.downloadProgress;
    }

    public addDownloadProgress() {
        this.downloadProgress++;
    }
}

export const PIXCRAWL_DATA = new PixcrawlData();
