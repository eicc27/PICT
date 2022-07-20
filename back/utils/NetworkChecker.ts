import { HttpError } from 'koa';
import { chromium, firefox } from 'playwright';
import Browsers from '../config/browsers';
import ENV from '../config/environment';
import * as https from 'https';

const PIXIV_MAIL_XPATH = '//tr[3]//strong';

enum STATUS {
    unchecked, success, fail
}

function checked(status: STATUS): boolean {
    return status != STATUS.unchecked;
}

export default class NetworkChecker {

    private networkStatus = STATUS.unchecked;
    private accountStatus = STATUS.unchecked;

    private static async launchFirefox() {
        return await firefox.launchPersistentContext(ENV.BROWSER.getProfileDir());
    }

    private static async launchChrome(type = Browsers.Chromium) {
        if (type == Browsers.Chromium)
            return await chromium.launchPersistentContext(ENV.BROWSER.getProfileDir(), {
                executablePath: ENV.BROWSER.getExecPath(),
                //headless: false
            });
        else
            return await chromium.launchPersistentContext(ENV.BROWSER.getProfileDir(), {
                executablePath: ENV.BROWSER.getExecPath(),
                //headless: false,
                channel: type,
            });
    }

    private static async createBrowser() {
        let browser = null;
        switch (ENV.BROWSER.getType()) {
        case Browsers.Firefox:
            browser = await this.launchFirefox();
            break;
        case Browsers.Chromium:
            browser = await this.launchChrome();
            break;
        case Browsers.Edge:
            browser = await this.launchChrome(Browsers.Edge);
            break;
        case Browsers.Chrome:
            browser = await this.launchChrome(Browsers.Chrome);
            break;
        default:
            throw new HttpError('No matching browsers found. Internal server error.');
        }
        return browser;
    }

    /**
     * checks the Pixiv login status by matching user email.
     * @todo: browser must be a singleton.
     * @returns `bool`, whether the user is logined
     */
    public async checkLoginStatus(): Promise<STATUS> {
        console.log(this.accountStatus);
        if (checked(this.accountStatus))
            return this.accountStatus;
        const browser = await NetworkChecker.createBrowser();
        const page = await browser.newPage();
        try {
            await page.goto(ENV.PIXIV.user, { waitUntil: 'domcontentloaded' });
        } catch (e) {
            this.accountStatus = STATUS.fail;
            throw new HttpError('Network unavailable. This should not happen if previous network checking is passed. Check the proxy again.');
        }
        try {
            const mail = await page.locator(PIXIV_MAIL_XPATH).innerHTML({ timeout: 2_000 });
            console.log(mail);
            await page.close();
            await browser.close();
            this.accountStatus = 
                mail == ENV.ACCOUNT.getMail() ?
                    STATUS.success : STATUS.fail;
            return this.accountStatus;
        } catch (e) {
            await page.close();
            await browser.close();
            console.log(e);
            this.accountStatus = STATUS.fail;
            return STATUS.fail;
        }
    }

    private async connectionTimeout(timeout: number): Promise<STATUS> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(STATUS.fail);
            }, timeout);
        });
    }

    private async connectToPixiv(): Promise<STATUS> {
        return new Promise((resolve) => {
            https.get(ENV.TEST_WEBSITE, (resp) => {
                console.log(resp.statusCode);
                if (resp.statusCode == 200 || resp.statusCode == 302) {
                    console.log('connection successful');
                    resolve(STATUS.success);
                }
                else {
                    console.log('connection failed');
                    resolve(STATUS.fail);
                }
            });
        });
    }

    /**
     * checks whether you're connected to overseas proxy.
     * @returns `bool` whether you are connected to `ENV.TEST_WEBSITE` in `timeout` milis.
     * Default: 10s.
     */
    public async checkNetworkStaus(timeout = 10_000): Promise<STATUS> {
        console.log(this.networkStatus);
        if (checked(this.networkStatus))
            return new Promise((resolve) => { resolve(this.networkStatus); });
        this.networkStatus = await Promise.race([
            this.connectionTimeout(timeout),
            this.connectToPixiv()
        ]);
        return this.networkStatus;
    }
}