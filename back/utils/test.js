async function asyncTimeout(delay, arr) {
    return new Promise(
        (resolve) => {
            setTimeout(
                () => {
                    arr.push(delay);
                    resolve(console.log('complete'));
                }, delay
            );
        }
    );
}

let arr = [];
let delays = [1000, 2000, 3000];

Promise.all([
    asyncTimeout(delays[0], arr),
    asyncTimeout(delays[1], arr),
    asyncTimeout(delays[2], arr)
], () => {
    console.log(arr);
});