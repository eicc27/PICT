import chalk from "chalk";

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

export function axiosErrorLogger(error: any, url: string) {
    let requestTargetString = `Requesting ${chalk.blueBright(url)}:`;
    if (error.response) {
        (new Logger(`${requestTargetString} The server responded with ${chalk.yellow(error.response.status)}`, SigLevel.warn)).log();
    } else if (error.request) {
        (new Logger(`${requestTargetString} The server is not responding!`, SigLevel.error)).log();
    } else {
        (new Logger(`${requestTargetString} Problems occur while sending requests! Most probably a network problem.`, SigLevel.error)).log();
    }
}

export function axiosResponseLogger(url: string) {
    (new Logger(`Response recieved from: ${chalk.blueBright(url)}`)).log();
}