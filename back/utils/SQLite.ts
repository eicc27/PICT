import Database, { Database as DB } from 'better-sqlite3';
import * as fs from 'fs';
import { Picture } from '../src/pixcrawl.js';

export const DB_DIR = "../db/pict.db";
export const SQL_DIR = "../db/pict.sql";
const CHAR_LOOKUP = {
    '/': '//',
    "'": "''",
    '[': '/[',
    ']': '/]',
    '%': '/%',
    '&': '/&',
    '_': '/_',
    '(': '/(',
    ')': '/)'
}

function sql(s: string) {
    const keys = Object.keys(CHAR_LOOKUP);
    const values = Object.values(CHAR_LOOKUP);
    for (let i = 0; i < keys.length; i++) {
        s = s.replace(keys[i], values[i]);
    }
    return s;
}

export class SQLite {
    private db: DB;

    public constructor() {
        this.db = new Database(DB_DIR);
    }

    public createTables() {
        const sql = fs.readFileSync(SQL_DIR).toString();
        this.db.exec(sql);
    }

    public getConnection() {
        return this.db;
    }

    public addPicture(picture: Picture) {
        const that = this;
        const transaction = function () {
            const urls: string[] = picture.url.split('/');
            const date = `${urls.at(-7)}-${urls.at(-6)}-${urls.at(-5)} ${urls.at(-4)}:${urls.at(-3)}:${urls.at(-2)}`;
            // upsert into Illusts
            const illustInsertionQuery = `INSERT INTO Illusts (id, name) VALUES ('${picture.uid}', '${sql(picture.uname)}')
ON CONFLICT(id) DO UPDATE SET name=excluded.name`;
            console.log(illustInsertionQuery);
            that.db.exec(illustInsertionQuery);
            // upsert into Pictures
            const pictureInsertionQuery = `INSERT INTO Pictures 
(id, title, illust_id, time) VALUES
('${picture.pid}', '${sql(picture.title)}', '${picture.uid}', '${date}')
ON CONFLICT(id) DO UPDATE SET
title=excluded.title, illust_id=excluded.illust_id, time=excluded.time`;
            console.log(pictureInsertionQuery);
            that.db.exec(pictureInsertionQuery);
            const pictureIndexesInsertionQuery = `INSERT INTO Picture_indexes
(pid, "index") VALUES ('${picture.pid}', ${picture.index})
ON CONFLICT(pid, "index") DO NOTHING`;
            console.log(pictureIndexesInsertionQuery);
            that.db.exec(pictureIndexesInsertionQuery);
            for (const tag of picture.tags) {
                if (tag.translation)
                    that.db.exec(`INSERT INTO Tags
(tag, translation) VALUES ('${sql(tag.tag)}', '${sql(tag.translation)}')
ON CONFLICT (tag) DO UPDATE SET translation=excluded.translation`);
                else
                    that.db.exec(`INSERT INTO Tags
(tag) VALUES ('${sql(tag.tag)}')
ON CONFLICT (tag) DO NOTHING`);
                that.db.exec(`INSERT INTO Picture_tags
(pid, tag) VALUES ('${picture.pid}', '${sql(tag.tag)}') 
ON CONFLICT(pid, tag) DO NOTHING`);
            }
            console.log('transaction end');
        }
        const insertPicture = this.db.transaction(transaction);
        insertPicture();
        // transaction();
    }

    public countPictures(): number[] {
        const result = this.db.prepare(`SELECT COUNT(*) AS total FROM Picture_indexes 
        UNION ALL
        SELECT COUNT(*) AS total FROM Illusts;`).all();
        return [result[0].total, result[1].total];
    }
}

export const SQLITE_DB = new SQLite();