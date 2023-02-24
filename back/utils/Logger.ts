import chalk from "chalk";
import { SYSTEM_SETTINGS } from "./System.js";

class Logger {
    private logHead(siglevel: string) {
        return `[${chalk.gray(new Date().toLocaleString())}] (${siglevel}) `;
    }

    private log(siglevel: string, ...msgs: Object[]) {
        if (!msgs.length) throw new EvalError("Logger: must specify a message");
        const head = msgs.splice(0, 1)[0]
        process.stdout.write(this.logHead(siglevel));
        console.log(head);
        for (const msg of msgs) {
            const msgStr = msg.toString();
            console.log(
                msgStr.length < 100 ? msgStr : msgStr.slice(0, 100) + "..."
            );
        }
    }

    public warn(...msgs: Object[]) {
        if (SYSTEM_SETTINGS.logLevel == 'error') return;
        this.log(chalk.yellowBright("warn"), ...msgs);
    }

    public error(...msgs: Object[]) {
        this.log(chalk.redBright("error"), ...msgs);
    }

    public ok(...msgs: Object[]) {
        if (SYSTEM_SETTINGS.logLevel == 'warn' ||
            SYSTEM_SETTINGS.logLevel == 'error')
            return;
        this.log(chalk.greenBright("ok"), ...msgs);
    }

    public info(...msgs: Object[]) {
        if (SYSTEM_SETTINGS.logLevel == 'info' ||
            SYSTEM_SETTINGS.logLevel == 'debug')
            this.log(chalk.blueBright("info"), ...msgs);
    }

    public debug(...msgs: Object[]) {
        if (SYSTEM_SETTINGS.logLevel == 'debug')
            this.log(chalk.cyanBright("debug"), ...msgs);
    }

    public easter(easterType: string, ...msgs: Object[]) {
        this.log(easterType, ...msgs);
    }
}
export const LOGGER = new Logger();

export function logfcall(needParams = true) {
    return function (target: any, propKey: string, desc: PropertyDescriptor) {
        const { value } = desc;
        desc.value = function (...args: any[]) {
            const argsString: string[] = [];
            for (const arg of args) {
                argsString.push(arg.toString());
            }
            if (needParams)
                LOGGER.debug(
                    `Function call: ${propKey}(${argsString.join(", ")})`
                );
            else LOGGER.debug(`Function call: ${propKey}`);
            const res = value.apply(this, args);
            return res;
        };
        return desc;
    };
}
