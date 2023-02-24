import Database, { Database as DB } from "better-sqlite3";
import * as fs from "fs";
import { Picture } from "../src/pixcrawl.js";
import { logfcall, LOGGER } from "./Logger.js";
import sharp from "sharp";
import { Image } from "./Image.js";
import { AsyncPool } from "./AsyncPool.js";

export const DB_DIR = "../db/pict.db";
export const SQL_DIR = "../db/pict.sql";
const CHAR_LOOKUP = {
    "/": "//",
    "'": "''",
    "[": "/[",
    "]": "/]",
    "%": "/%",
    "&": "/&",
    _: "/_",
    "(": "/(",
    ")": "/)",
};

function sql(s: string, reverse = false) {
    const keys = Object.keys(CHAR_LOOKUP);
    const values = Object.values(CHAR_LOOKUP);
    for (let i = 0; i < keys.length; i++) {
        if (!reverse) s = s.replace(keys[i], values[i]);
        else s = s.replace(values[i], keys[i]);
    }
    return s;
}

class SQLite {
    private db: DB;

    public constructor() {
        this.db = new Database(DB_DIR);
    }

    @logfcall() public createTables() {
        const sql = fs.readFileSync(SQL_DIR).toString();
        this.db.exec(sql);
    }

    @logfcall() public getConnection() {
        return this.db;
    }

    @logfcall() public addPicture(picture: Picture) {
        const that = this;
        const transaction = function () {
            if (!picture.url || !picture.uname || !picture.title || !picture.tags) return;
            const urls: string[] = picture.url.split("/");
            const date = `${urls.at(-7)}-${urls.at(-6)}-${urls.at(
                -5
            )} ${urls.at(-4)}:${urls.at(-3)}:${urls.at(-2)}`;
            // upsert into Illusts
            const illustInsertionQuery = `INSERT INTO Illusts (id, name) VALUES ('${
                picture.uid
            }', '${sql(picture.uname)}')
ON CONFLICT(id) DO UPDATE SET name=excluded.name`;
            that.db.exec(illustInsertionQuery);
            // upsert into Pictures
            const pictureInsertionQuery = `INSERT INTO Pictures 
(id, title, illust_id, time) VALUES
('${picture.pid}', '${sql(picture.title)}', '${picture.uid}', '${date}')
ON CONFLICT(id) DO UPDATE SET
title=excluded.title, illust_id=excluded.illust_id, time=excluded.time`;
            that.db.exec(pictureInsertionQuery);
            const pictureIndexesInsertionQuery = `INSERT INTO Picture_indexes
(pid, "index") VALUES ('${picture.pid}', ${picture.index})
ON CONFLICT(pid, "index") DO NOTHING`;
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
        };
        const insertPicture = this.db.transaction(transaction);
        insertPicture();
        // transaction();
    }

    @logfcall() public countPictures(): number[] {
        const result = this.db
            .prepare(
                `SELECT COUNT(*) AS total FROM Picture_indexes 
        UNION ALL
        SELECT COUNT(*) AS total FROM Illusts;`
            )
            .all();
        return [result[0].total, result[1].total];
    }

    @logfcall() public async getSelectedPicture() {
        const picture = this.db
            .prepare(
                `SELECT * FROM Pictures ORDER BY views DESC, last_access DESC, \`time\` DESC LIMIT 1`
            )
            .all();
        if (!picture.length) {
            LOGGER.error("No picture in db");
            return null;
        }
        const selected = picture[0];
        const img = `../lsp/${selected.id}_0.png`;
        const imgBuf = fs.readFileSync(img);
        const image = new Image(imgBuf);
        return await image.cropToFit((await image.getSize())[0], 200);
    }

    @logfcall() public async getPictures(limit: number, offset: number) {
        const offsetNum = limit * offset;
        const pictures = this.db
            .prepare(
                `SELECT Pictures.title as title, Pictures.id as id, Illusts.name as illust
        FROM Pictures
        JOIN Illusts ON (Pictures.illust_id = Illusts.id)
        ORDER BY Pictures.views DESC, Pictures.last_access DESC, Pictures.\`time\` DESC
        LIMIT ${limit} OFFSET ${offsetNum}`
            )
            .all();
        const results: any[] = [];
        const pool = new AsyncPool(16);
        const getResult = async function (
            results: any[],
            fpath: string,
            picture: any
        ) {
            const imgBuf = fs.readFileSync(fpath);
            results.push({
                title: sql(picture.title, true),
                image: await new Image(imgBuf).resizeToFit(250, 250),
                illust: sql(picture.illust, true),
                pid: picture.id,
            });
        };
        for (const picture of pictures) {
            await pool.submit(
                getResult,
                results,
                `../lsp/${picture.id}_0.png`,
                picture
            );
        }
        await pool.close();
        return results;
    }

    @logfcall() public getPicture(pid: string) {
        const that = this;
        const picture: any = {};
        const transaction = function () {
            // update access time and views
            that.db.exec(`UPDATE Pictures
            SET last_access = datetime('now', 'localtime'),
                views = views + 1
            WHERE id = '${pid}'`);
            // get picture info except tags & indexes
            const result = that.db
                .prepare(
                    `SELECT *
            FROM Pictures p
                JOIN Illusts i ON (i.id = p.illust_id)
            WHERE p.id = '${pid}'`
                )
                .all()[0];
            picture.title = sql(result.title, true);
            picture.illust = result.name;
            picture.illustId = sql(result.illust_id, true);
            picture.time = result.time;
            picture.views = result.views;
            // get picture tags info
            const tagResults = that.db
                .prepare(
                    `SELECT tag, translation
            FROM Pictures p
                JOIN Picture_tags pt ON (p.id = pt.pid)
                JOIN tags t USING (tag)
            WHERE p.id = '${pid}'`
                )
                .all();
            picture.tags = tagResults;
            // get picture indexes info
            const indexResults = that.db
                .prepare(
                    `SELECT \`index\`
            FROM Picture_indexes WHERE pid = '${pid}' ORDER BY \`index\` ASC`
                )
                .all();
            picture.indexes = indexResults.flatMap((result) => result.index);
        };
        const getPicture = this.db.transaction(transaction);
        getPicture();
        return picture;
    }
}

export const SQLITE_DB = new SQLite();
