import Logger, { SigLevel } from "./Logger";

class TimerResult {
    private index: number;

    constructor(i: number) {
        this.index = i;
    }
}

export default class Timer {
    timeout: number;
    retrial: number;

    public constructor(timeoutInSecs: number, retrial: number) {
        this.timeout = timeoutInSecs;
        this.retrial = retrial;
    }

    private async timer(i: number): Promise<TimerResult> {
        return new Promise((resolve) => {
            setTimeout(() => { resolve(new TimerResult(i)); }, this.timeout * 1000);
        });
    }

    /**
     * A pool-friendly global retrial function.
     * @param job A `Promise` to be fulfilled.
     * @returns the job if it finally successes, else null
     */
    public async time(job: Promise<unknown>){
        for (let i = 0; i < this.retrial; i++) {
            const promise = await Promise.race([this.timer(i), job]);
            if (! (promise instanceof TimerResult)) {
                return promise;
            }
            (new Logger(`Retrial #${i + 1} failed!`, SigLevel.warn)).log();
        }
        (new Logger('Max retrial achieved!', SigLevel.warn)).log();
        return;
    }
}