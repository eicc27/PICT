import axios from "axios";
import chalk from "chalk";
import { JSDOM } from "jsdom";
import { ENV } from "../../../config/environment";
import { createWriteStream, accessSync, writeFileSync, constants } from "fs";
import Logger, { SigLevel } from "../../Logger";

export default class MongoBinGetter {

    private async getMongoLatestUrl(): Promise<string> {
        return new Promise((resolve) => {
            axios.get(ENV.MONGO.DONWLOAD)
                .then((resp) => {
                    let html = (new JSDOM(resp.data)).window.document;
                    switch (ENV.PLATFORM) {
                        case 'win32':
                            resolve(this.getWindowsMongoLatestUrl(html));
                            return;
                        case 'linux':
                            resolve('none'); // todo
                            return;
                    }
                });
        });
    }

    private async getWindowsMongoLatestUrl(html: Document) {
        let latestList = html.querySelector('main>div>main>div>div');
        let versionNumber = latestList.querySelector('h3').innerHTML;
        // 6.0.1 -> v601
        versionNumber = 'v' + versionNumber.split('.').join('');
        //v601windowsx64
        let listItems = latestList.querySelectorAll(`ul>li`);
        let windowsItem: Element;
        for (const item of listItems) {
            let id = item.querySelectorAll(`a[id=${versionNumber}windowsx64]`);
            if (id.length)
                windowsItem = item;
        }
        let windowsItems = windowsItem.querySelectorAll('ul>li>p');
        for (const item of windowsItems) {
            if (!item.innerHTML.includes('Archive')) continue;
            return item.querySelector('a').getAttribute('href');
        }
    }

    public async getMongoLatest() {
        let url = await this.getMongoLatestUrl();
        axios.get(url, {
            responseType: 'stream',
        }).then((resp) => {
            let zipname = url.split('/').at(-1);
            let path = `../${zipname}`;
            let downloaded = 0;
            // console.log(resp.headers);
            let total: number = parseInt(resp.headers['content-length']);
            let interval = setInterval(() => {
                (new Logger(`DBDL: Progress ${(100 * downloaded / total).toFixed(2)}%`)).log();
            }, 5000);
            try {
                accessSync(path, constants.F_OK);
            } catch (error) {
                writeFileSync(path, '', { flag: 'w+' });
                (new Logger(`FS: Created new file ${chalk.yellowBright(zipname)}`)).log();
            }
            resp.data.pipe(createWriteStream(path, {
                flags: 'r+'
            }));
            resp.data.on('data', (chunck: any) => {
                downloaded += chunck.length;
            });
            resp.data.on('end', () => {
                (new Logger(`DBDL: MongoDB ${zipname} download complete.`, SigLevel.ok)).log();
                clearInterval(interval);
            });
        });
    }
}