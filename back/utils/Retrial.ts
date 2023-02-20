import { logfcall, LOGGER } from "./Logger.js";
import { SYSTEM_SETTINGS } from "./System.js";

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
    @logfcall(false) public static async retry(
        func: (...args: unknown[]) => Promise<unknown>,
        ...args: unknown[]
    ) {
        return new Promise(async function (resolve, reject) {
            let error: any = null;
            for (let i = 0; i < SYSTEM_SETTINGS.retrial.times; i++) {
                try {
                    const ret = await Promise.race([
                        Retrial.timeOutFunction(
                            SYSTEM_SETTINGS.retrial.timeout
                        ),
                        func(...args),
                    ]);
                    if (!(ret instanceof RetrialTimer)) {
                        resolve(ret);
                        return;
                    }
                    continue;
                } catch (e: any) {
                    LOGGER.warn(`Retrial ${i + 1}:`);
                    console.log(e);
                    error = e;
                    continue;
                }
            }
            LOGGER.error("Max retrial exceeded");
            reject(error);
            return;
        });
    }
}
