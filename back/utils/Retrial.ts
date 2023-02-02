import { logfcall, LOGGER } from "./Logger.js";

class RetrialTimer {
    private timer: number;
    public constructor(timer: number) {
        this.timer = timer;
    }
}

export class Retrial {
    private static async timeOutFunction(timeOut: number) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(new RetrialTimer(timeOut));
            }, timeOut * 1000);
        });
    }

    /** The function printed includes the function code. Disable parameter printing. */
    @logfcall(false) public static async retry(retrial: number, timeOut: number,
        func: (...args: unknown[]) => Promise<unknown>, ...args: unknown[]) {
        return new Promise(async function (resolve, reject) {
            for (let i = 0; i < retrial; i++) {
                if (i)
                    LOGGER.warn(`Retrial ${i}`);
                try {
                    const ret = await Promise.race([Retrial.timeOutFunction(timeOut), func(...args)]);
                    if (!(ret instanceof RetrialTimer)) {
                        resolve(ret);
                        return;
                    }
                    continue;
                } catch (e) {
                    console.log(e);
                    continue;
                }
            }
            LOGGER.error('Max retrial exceeded');
            reject('Max retrial exceeded');
            return;
        });
    }
}