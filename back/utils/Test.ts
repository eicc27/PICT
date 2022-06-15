import * as websocket from 'ws';
import * as fs from 'fs';
import * as https from 'https';

export default class Test {
    
    static testUrl = 'https://i.pximg.net/img-master/img/2022/06/10/00/00/03/98941448_p0_master1200.jpg';

    static exampleResponse = {
        server: 'nginx',
        date: 'Tue, 14 Jun 2022 15:04:40 GMT',
        'content-type': 'image/jpeg',
        'content-length': '543871',
        connection: 'close',
        'cache-control': 'max-age=31536000',
        expires: 'Tue, 13 Jun 2023 14:58:28 GMT',
        'last-modified': 'Thu, 09 Jun 2022 15:00:03 GMT',
        'x-content-type-options': 'nosniff',
        age: '86664',
        via: 'http/1.1 f006 (second)',
        'accept-ranges': 'bytes'
    };

    static testHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
        'Referer': 'https://www.pixiv.net/',
    };

    /** downloads the content of testUrl into a given file, and sends the download progress to the given websocket
    */
    static testHeadRequest(ws: websocket.WebSocket) {
        ws.send('head request start');
        https.get(Test.testUrl, {
            method: 'HEAD', 
            headers: Test.testHeaders,
        }, async (response) => {
            const contentLength = response.headers['content-length'];
            ws.send(`content-length: ${contentLength}`);
            await Test.testDownload(ws, contentLength);
        });
    }

    /** experimental implementation of multi-threaded downloading */
    static async testDownload(
        ws: websocket.WebSocket,
        contentLength: string, 
        threads=4) {
        ws.send('download start');
        const blockSize = Math.floor(parseInt(contentLength) / threads);
        const sizes = [];
        for (let i = 0; i < threads; i++) {
            if (i === threads - 1) {
                sizes.push(parseInt(contentLength) - blockSize * i);
            } else {
                sizes.push(blockSize);
            }
        }
        console.log(sizes);
        const promises = [];
        for (let i = 0; i < threads; i++) {
            promises.push(Test.testThreadedDownload(ws, blockSize * i , blockSize * i + sizes[i] - 1, i));
        }
        await Promise.all(promises);
        ws.send('download done');
        // joins the temp files into the final file
        const file = fs.createWriteStream('./test.jpg');
        for (let i = 0; i < threads; i++) {
            file.write(fs.readFileSync(`./test${i}.tmp`));
        }
        // and deletes the temp files
        for (let i = 0; i < threads; i++) {
            fs.unlinkSync(`./test${i}.tmp`);
        }
    }

    static async testThreadedDownload(ws: websocket.WebSocket, fromBytes: number, toBytes: number, index: number) {
        return new Promise(
            (resolve) => {
                console.log(`${index}: bytes=${fromBytes}-${toBytes}`);
                https.get(Test.testUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
                        'Referer': 'https://www.pixiv.net/',
                        Range: `bytes=${fromBytes}-${toBytes}`
                    },
                }, (response) => {
                    response.pipe(fs.createWriteStream(`./test${index}.tmp`)); //, {
                    //    start: fromBytes,
                    //    flags: 'r+'
                    //}));
                    // on every data chunk, send the progress to the websocket,
                    // and write the data to the file
                    response.on('data', (chunck) => {
                        ws.send(`${index}: ${chunck.length}`);
                    });
                    // on end, resolve the promise
                    response.on('end', () => {
                        resolve(`${index}: done`);
                    });
                });
            }
        );
    }
}