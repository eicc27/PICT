import { BaseHandler } from "../socket/BaseHandler.js";
import { SQLITE_DB } from "./SQLite.js";

type SearchOption = {
    pname?: string, // obsolete search
    illust?: string,
    uid?: string,
    tag?: string,
    orderBy?: string, // supports time & views
    desc?: string,
};

export class SearchHandler {
    private searchOption: SearchOption;

    public constructor (searchOption: SearchOption) {
        this.searchOption = searchOption;
    }

    public handle() {
        const keys = Object.keys(this.searchOption);
        const values = Object.values(this.searchOption);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];
            const query = `SELECT * FROM Pictures
            JOIN Illusts ON Pictures.illust_id = Illusts.id
            JOIN Picture_indexes ON Picture_indexes.pid = Illusts.id
            JOIN Picture_tags ON Picture_tags.pid = Illusts.id
            JOIN Tags ON Tags.tag = Picture_tags.tag`
        }
    }
} 