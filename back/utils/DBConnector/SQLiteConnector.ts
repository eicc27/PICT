import Database from 'better-sqlite3';
import chalk from 'chalk';
import Logger, { dbLogger } from '../Logger';
import { createHash } from 'crypto';

/** The type of the value is induced by `typeof`. Mind that the max length of the string is set doubled.
 */
export class SQLColumnType {
    value: string | number | Date;
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
function auto(value: string | number | Date) {
    switch (typeof value) {
        case 'number':
            return `integer`;
        case 'string':
        case 'object': // Date
            return `text`;
    }
}

function identifier() {
    let timeStr = String((new Date()).getUTCMilliseconds());
    let salt = '';
    for (let i = 0; i < 10; i++) {
        salt += String(Math.floor((Math.random() * 10) % 10));
    }
    let hashStr = timeStr + salt;
    return createHash('sha256').update(hashStr).digest('hex').slice(0, 6);
}

export default class SQLiteConnector<T extends Map<string, SQLColumnType>> {
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

    public selectAllWhenPropertyEqual(propertyList: T) {
        let queryStrs = [];
        for (const [column, value] of propertyList) {
            if (typeof value.value == 'number')
                queryStrs.push(`\`${column}\`=${value.value}`)
            else
                queryStrs.push(`\`${column}\`='${value.value}'`)
        }
        let query = `select * from ${this.tableName} where ${queryStrs.join(' and ')};`;
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret = this.connection.prepare(query).all();
        dbLogger('SQLite', query, id, 'from', ret);
        return ret;
    }

    private _insertOrUpdate(propertyList: T, updateRefColumn?: string) {
        let columns = [];
        let values = [];
        for (const [column, value] of propertyList) {
            columns.push(`\`${column}\``);
            values.push(`'${value.value}'`);
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