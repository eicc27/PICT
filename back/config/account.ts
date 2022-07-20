import { readFileSync } from 'fs';

const ACCOUNT_CONFIG_PATH = './data/account.json';

export default class Account {
    private name: string;
    private mail: string;
    private password: string;

    constructor () {
        const account = JSON.parse(readFileSync(ACCOUNT_CONFIG_PATH, {encoding: 'utf-8'}));
        this.name = account.name;
        this.mail = account.mail;
        this.password = account.password;
    }

    public getName() {
        return this.name;
    }

    public getMail() {
        return this.mail;
    }

    public getPassword() {
        return this.password;
    }
}