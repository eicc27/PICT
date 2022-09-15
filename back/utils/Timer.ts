import chalk from "chalk";
import AsyncPool from "./AsyncPool";
import Logger, { SigLevel } from "./Logger";

export default class Timer {
    timeout: number;
    retrial: number;

    public constructor(timeoutInSecs: number, retrial: number) {
        this.timeout = timeoutInSecs;
        this.retrial = retrial;
    }

    private async timer(): Promise<this> {
        return new Promise((resolve) => {
            setTimeout(() => { resolve(this); }, this.timeout * 1000);
        });
    }

    /**
     * A pool-friendly global retrial function.
     * @param job A `Promise` to be fulfilled.
     * @param pool The pool to be submitted. If passed, the retrial job will also wait for the pool to close.
     * @param retrial Recursion parameter. When max retrial achieved, the function would give up.
     * @returns 
     */
    public async time(job: Promise<unknown>, pool?: AsyncPool, retrial: number = 0) {
        let promise = await Promise.race([this.timer(), job]);
        if (promise == this && retrial < this.retrial) { // timeout comes first
            (new Logger(`Timer: Retrial #${chalk.yellowBright(retrial + 1)} triggered`, SigLevel.warn)).log();
            if (pool)
                await pool.submit(this.time(job, pool, ++retrial));
            else
                this.time(job, pool, ++retrial);
            return;
        } else if (promise != this) {
            return promise;
        } else {
            (new Logger(`Timer: Retrial failed with achieving max number ${this.retrial}`, SigLevel.error)).log();
            return null;
        }
    }
}