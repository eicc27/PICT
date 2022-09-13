import Database from 'better-sqlite3';
import chalk from 'chalk';
import Logger, { dbLogger } from '../Logger';
import { createHash } from 'crypto';

/** The type of the value is induced by `typeof`. Mind that the max length of the string is set doubled.
 */
export class SQLColumnType {
    value: string | number | Date;
    ai: boolean = false;
    pri: boolean = false;
    nn: boolean = false;
    foreign: boolean = false;
    ref?: string;
}

function auto(value: string | number | Date) {
    switch (typeof value) {
        case 'string':
            return `varchar(${value.length * 2})`;
        case 'number':
            return `int(10)`;
        case 'object':
            return `datetime`;
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
        this.connection = new Database(`../db/${dbName}.db`);
        this.tableName = tableName;
    }

    public info() {
        return this.connection.pragma(`table_info('${this.tableName}')`);
    }

    private queryColumnType(column: string) {
        let query = `select typeof('${column}') from ${this.tableName};`;
        (new Logger(`SQLite: ${chalk.yellowBright(query)}`)).log();
        return this.connection.prepare(query).all()[0];
    }

    private alterColumnType(column: string, type: string) {
        let query = `alter table ${this.tableName} alter column ${column} ${type} not null;`;
        (new Logger(`SQLite: ${chalk.yellowBright(query)}`)).log();
        return this.connection.prepare(query).run().changes;
    }

    public createTable(propertyList: T) {
        let queryStrs = [];
        let extraStrs = [];
        for (const [column, value] of propertyList) {
            let queryStr = `${column} ${auto(value.value)}`;
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
        let query = `create table ${this.tableName} (${queryStrs.concat(extraStrs).join(',')});`;
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

    public insert(propertyList: T) {
        let columns = [];
        let values = [];
        for (const [column, value] of propertyList) {
            columns.push(`\`${column}\``);
            values.push(`'${value.value}'`);
            if (typeof value.value == 'string' && value.value.length > parseInt(this.queryColumnType(column)))
                this.alterColumnType(column, auto(value.value));
        }
        let query = `insert into ${this.tableName} (${columns.join(',')}) values (${values.join(',')});`;
        let id = identifier();
        dbLogger('SQLite', query, id, 'to');
        let ret =  this.connection.prepare(query).run().changes;
        dbLogger('SQLite', query, id, 'from', ret);
        return ret;
    }
}