import chalk from "chalk";
import { ENV } from "../config/environment";
import { createHash } from 'crypto';


export enum SigLevel { info = 'info', warn = 'warn', error = 'error', ok = 'ok' };

export default class Logger {
    private sigLevel: SigLevel;
    private msg: string;
    private timestamp = new Date().toLocaleTimeString();
    private filePath: string;

    public constructor(msg: string,
        sigLevel: SigLevel = SigLevel.info,
        filePath: string = null) {
        this.sigLevel = sigLevel;
        this.msg = msg;
        this.filePath = filePath;
    }

    /** Logs info with different colors considering different signal levels when logging in console.
     * 
     * `info`: blue
     * 
     * `warn`: yellow
     * 
     * `error`: red
     * 
     * `ok`: green
     */
    public log() {
        this.logToConsole();
    }

    private logToConsole() {
        let colorFunction: (...s: string[]) => string;
        switch (this.sigLevel) {
            case SigLevel.info:
                colorFunction = chalk.blueBright;
                break;
            case SigLevel.warn:
                colorFunction = chalk.yellow;
                break;
            case SigLevel.error:
                colorFunction = chalk.red;
                break;
            case SigLevel.ok:
                colorFunction = chalk.green;
                break;
        }
        console.log(
            `[${colorFunction(this.sigLevel)}] [${chalk.gray(this.timestamp)}] ${this.msg}`
        );
    }
}

export function identifier() {
    let timeStr = String((new Date()).getUTCMilliseconds());
    let salt = '';
    for (let i = 0; i < 10; i++) {
        salt += String(Math.floor((Math.random() * 10) % 10));
    }
    let hashStr = timeStr + salt;
    return createHash('sha256').update(hashStr).digest('hex').slice(0, 6);
}

export function axiosErrorLogger(error: any, url: string, retrial: number = 0) {
    let requestTargetString = `Requesting ${chalk.blueBright(url)}:`;
    if (error.response) {
        (new Logger(`Retrial #${chalk.yellowBright(retrial)} failed: ${requestTargetString} The server responded with ${chalk.yellow(error.response.status)}`, SigLevel.warn)).log();
    } else if (error.request) {
        (new Logger(`Retrial #${chalk.yellowBright(retrial)} failed: ${requestTargetString} The server is not responding!`, SigLevel.error)).log();
    } else {
        (new Logger(`Retrial #${chalk.yellowBright(retrial)} failed: ${requestTargetString} Problems occur while sending requests! Most probably a network problem.`, SigLevel.error)).log();
    }
    if (retrial == ENV.SETTINGS.MAX_RETRIAL)
        (new Logger(`Max retrial reached!`, SigLevel.error)).log();
}

export function axiosResponseLogger(url: string) {
    (new Logger(`Response recieved from: ${chalk.blueBright(url)}`)).log();
}

export function dbLogger(db: 'SQLite' | 'Mongo', query: string, id: string, direction: 'from' | 'to', result?: any) {
    let arrow = direction == 'from' ? '<-' : '->';
    let log = ` [${chalk.bgGrey.whiteBright(db)}] [${chalk.bgBlueBright.whiteBright(`#${id}`)} ${chalk.bgGreenBright.whiteBright(arrow)}]: ${chalk.yellowBright(query)}`;
    if (result) {
        if (typeof result == 'object')
            log += ` returned: ${chalk.blueBright(JSON.stringify(result))}`;
        else
            log += ` returned ${chalk.blueBright(result)}`;
    }
    (new Logger(log)).log();
}