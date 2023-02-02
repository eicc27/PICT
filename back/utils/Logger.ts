import chalk from "chalk";

class Logger {
    private logHead(siglevel: string) {
        return `[${chalk.gray(new Date().toLocaleString())}] (${siglevel}) `;
    }

    private log(siglevel: string, ...msgs: Object[]) {
        if (!msgs.length) throw new EvalError('Logger: must specify a message');
        const head = msgs.splice(0, 1)[0];
        console.log(this.logHead(siglevel) + head.toString());
        for (const msg of msgs)
            console.log(msg);
    }

    public warn(...msgs: Object[]) {
        this.log(chalk.yellowBright('warn'), ...msgs);
    }

    public error(...msgs: Object[]) {
        this.log(chalk.redBright('error'), ...msgs);
    }

    public ok(...msgs: Object[]) {
        this.log(chalk.greenBright('ok'), ...msgs);
    }

    public info(...msgs: Object[]) {
        this.log(chalk.blueBright('info'), ...msgs);
    }

    public debug(...msgs: Object[]) {
        this.log(chalk.cyanBright('debug'), ...msgs);
    }

    public easter(easterType: string, ...msgs: Object[]) {
        this.log(easterType, ...msgs);
    }
}
export const LOGGER = new Logger();

export function logfcall(needParams = false) {
    return function (target: any, propKey: string, desc: PropertyDescriptor) {
        const { value } = desc;
        desc.value = function (...args: any[]) {
            const res = value.apply(this, args);
            const argsString: string[] = [];
            for (const arg of args) {
                argsString.push(arg.toString());
            }
            if (needParams)
                LOGGER.debug(`Function call: ${propKey}(${argsString.join(', ')})`);
            else
                LOGGER.debug(`Function call: ${propKey}`);
            return res;
        }
        return desc;
    }
}