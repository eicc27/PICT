class Timer {
    private intervalfn: NodeJS.Timer;

    public constructor(interval: number, fn: () => void) {
        this.intervalfn = setInterval(fn, interval * 1000);
    }

    public stopTimer() {
        clearInterval(this.intervalfn);
    }
}
