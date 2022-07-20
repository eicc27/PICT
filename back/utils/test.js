// async function asyncTimeout(delay, arr) {
//     return new Promise(
//         (resolve) => {
//             setTimeout(
//                 () => {
//                     arr.push(delay);
//                     resolve(console.log('complete'));
//                 }, delay
//             );
//         }
//     );
// }

// let arr = [];
// let delays = [1000, 2000, 3000];

// Promise.all([
//     asyncTimeout(delays[0], arr),
//     asyncTimeout(delays[1], arr),
//     asyncTimeout(delays[2], arr)
// ], () => {
//     console.log(arr);
// });

function asyncTimeout(timeout) {
    return new Promise(
        (resolve) => {
            setTimeout(() => {
                console.log(`timeout: ${timeout}`);
                resolve(0);
            }, timeout);
        }
    );
}

let delays = [1000, 2000, 3000, 4000, 5000, 6000];
// let queue = [asyncTimeout(delays[0], 0), asyncTimeout(delays[1], 1), asyncTimeout(delays[2], 2)];
// for (let i = 3; i < delays.length; i++) {
//     await Promise.any(queue).then((value) => {
//         console.log(value);
//         queue[value] = asyncTimeout(delays[i], i);
//     });
// }

class AsyncPool {
    pool = [];
    maxWorkers;

    getVacantIndex() {
        if (this.pool.length < this.maxWorkers)
            return this.pool.length;
        else
            return null;
    }

    async wrapTaskWithIndex(task, index) {
        return task.then(() => { return index; });
    }

    constructor(maxWorkers) {
        this.maxWorkers = maxWorkers;
    }

    async submit(task) {
        const index = this.getVacantIndex();
        if (index !== null) {
            this.pool.push(this.wrapTaskWithIndex(task, index));
            console.log(this.pool.length);
        }
        else {
            await Promise.any(this.pool).then(
                (index) => {
                    console.log(`index: ${index}, pool: ${this.pool.length}`);
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

let pool = new AsyncPool(3);
for (let i = 0; i < 6; ++i) {
    await pool.submit(asyncTimeout(delays[i]));
}
await pool.close();

// let task = asyncTimeout(delays[0]);
// let num = await task.then(() => {
//     return 0;
// });

// console.log(num);
