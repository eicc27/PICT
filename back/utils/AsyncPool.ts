export default class AsyncPool {
    private pool: Promise<number>[] = [];
    private maxWorkers: number;

    private getVacantIndex() {
        if (this.pool.length < this.maxWorkers)
            return this.pool.length;
        else
            return null;
    }

    private async wrapTaskWithIndex(task: Promise<unknown>, index: number) {
        return task.then(() => { return index; });
    }

    constructor(maxWorkers: number) {
        this.maxWorkers = maxWorkers;
    }

    async submit(task: Promise<unknown>) {
        const index = this.getVacantIndex();
        if (index !== null) {
            this.pool.push(this.wrapTaskWithIndex(task, index));
            // console.log(this.pool.length);
        }
        else {
            await Promise.any(this.pool).then(
                (index) => {
                    // console.log(`index: ${index}, pool: ${this.pool.length}`);
                    this.pool[index] = this.wrapTaskWithIndex(task, index);
                }
            );
        }
    }

    async close() {
        await Promise.all(this.pool);
        this.pool = [];
        delete this.pool;
    }
}