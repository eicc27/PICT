import Database from 'better-sqlite3';
import chalk from 'chalk';
import { Picture } from '../../types/Types';
import Logger, { dbLogger, identifier } from '../Logger';

function sqlify(value: string | number) {
    // single quote
    value = String(value);
    value = value.split("'").join("''");
    value = `'${value}'`;
    return value;
}

/** The type of the value is induced by `typeof`. Mind that the max length of the string is set doubled.
 */
export class SQLColumnType {
    value: string | number;
    ai?: boolean = false;
    pri?: boolean = false;
    nn?: boolean = false;
    foreign?: boolean = false;
    ref?: string;
}

/**
 * 
 * @param value 
 * @returns 
 */
function auto(value: string | number) {
    switch (typeof value) {
        case 'number':
            return `integer`;
        case 'string':
        case 'object': // Date
            return `text`;
    }
}



export default class SQLiteConnector<T extends Map<string, SQLColumnType> | Map<string, SQLColumnType>> {
    private tableName: string;
    private connection: Database.Database;

    public constructor(tableName: string, dbName: string) {
        this.connection = new Database(`../db/sqlite3/${dbName}.db`);
        this.tableName = tableName;
    }

    public switchToTable(tableName: string) {
        this.tableName = tableName;
        return this;
    }

    public info() {
        return this.connection.pragma(`table_info('${this.tableName}')`);
    }

    public queryColumnType(column: string) {
        let query = `select typeof('${column}') from ${this.tableName};`;
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret = this.connection.prepare(query).all();
        dbLogger('SQLite', query, id, 'from', ret);
        return ret;
    }

    public createTable(propertyList: T) {
        let queryStrs = [];
        let extraStrs = [];
        for (const [column, value] of propertyList) {
            let queryStr = `\`${column}\` ${auto(value.value)}`;
            if (value.foreign)
                extraStrs.push(`foreign key (\`${column}\`) references ${value.ref}`);
            if (value.pri)
                extraStrs.push(`primary key (\`${column}\`)`);
            if (value.ai)
                queryStr += ' auto_increment';
            if (value.nn)
                queryStr += ' not null';
            queryStrs.push(queryStr);
        }
        let query = `create table if not exists ${this.tableName} (${queryStrs.concat(extraStrs).join(',')});`;
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret = this.connection.prepare(query).run().changes;
        dbLogger('SQLite', query, id, 'from', ret);
        return ret;
    }

    public selectAllWhenPropertyEqual(propertyList?: T) {
        let queryStrs = [];
        let query: string;
        if (propertyList) {
            for (const [column, value] of propertyList) {
                if (typeof value.value == 'number')
                    queryStrs.push(`\`${column}\`='${value.value}'`)
                else
                    queryStrs.push(`\`${column}\`=${sqlify(value.value)}`)
            }
            query = `select * from ${this.tableName} where ${queryStrs.join(' and ')};`;
        } else {
            query = `select * from ${this.tableName};`;
        }
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret = this.connection.prepare(query).all();
        dbLogger('SQLite', query, id, 'from', ret);
        return ret;
    }

    public static toPictures() {
        let connector = new SQLiteConnector('PID', 'pixcrawl');
        let pictures: Picture[] = [];
        let pids = connector.switchToTable('PID').selectAllWhenPropertyEqual();
        for (const pid of pids) {
            let pidMap = new Map<string, SQLColumnType>();
            pidMap.set('pid', { value: pid.pid });
            let urlJsons = connector.switchToTable('URL').selectAllWhenPropertyEqual(pidMap);
            let urls = [];
            for (const url of urlJsons) { urls.push(url.url); }
            let uidMap = new Map<string, SQLColumnType>();
            uidMap.set('uid', { value: pid.uid });
            let uname = connector.switchToTable('UID').selectAllWhenPropertyEqual(uidMap)[0].uname;
            let tags = [];
            let tagJsons = connector.switchToTable('TAG').selectAllWhenPropertyEqual(pidMap);
            for (const tag of tagJsons) { tags.push(tag.tag); }
            pictures.push({
                pid: pid.pid,
                pname: pid.pname,
                originalUrls: urls,
                tags: tags,
                uid: pid.uid,
                uname: uname
            });
        }
        return pictures;
    }

    private _insertOrUpdate(propertyList: T, updateRefColumn?: string) {
        let columns = [];
        let values = [];
        for (const [column, value] of propertyList) {
            columns.push(`\`${column}\``);
            values.push(sqlify(value.value));
        }
        let query = `insert into ${this.tableName} (${columns.join(',')}) values (${values.join(',')})`;
        if (updateRefColumn) {
            let i = columns.findIndex((v) => { return v.slice(1, -1) == updateRefColumn; });
            // console.log(i);
            if (i >= 0) {
                columns.splice(i, 1);
                let v = values.splice(i, 1)[0];
                query += ` on conflict (${updateRefColumn}) do update set (${columns.join(',')})=(${values.join(',')}) where (${updateRefColumn}=${v});`;
            }
        }
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret = this.connection.prepare(query).run().changes;
        dbLogger('SQLite', query, id, 'from', ret);
        return this;
    }

    public insertOrUpdate(propertyList: T, updateRefColumn?: string): SQLiteConnector<T>;
    public insertOrUpdate(propertyList: T[], updateRefColumn?: string): SQLiteConnector<T>;

    public insertOrUpdate(propertyList: T | T[], updateRefColumn?: string) {
        if (Array.isArray(propertyList)) {
            for (const l of propertyList) {
                this._insertOrUpdate(l, updateRefColumn);
            }
        } else {
            this._insertOrUpdate(propertyList, updateRefColumn);
        }
        return this;
    }

}