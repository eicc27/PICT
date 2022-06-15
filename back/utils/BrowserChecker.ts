import { exec } from 'child_process';
import { readdirSync } from 'fs';

/**
 * All available browsers.
*/
class Browsers{
    static Firefox = 'firefox';
    static Chrome = 'chrome';
    static Edge = 'edge';
    static Chromium = 'chromium';
}


/**  pre-checks browsers for playwright.
* chromium, chrome & edge can use native versions.
* firefox must use shipped versions.
* https://playwright.dev/docs/browsers
* 
* Versions list of browsers:
* https://www.mozilla.org/en-US/firefox/releases/
* 
*/
export default class BrowserChecker {

    os = String(process.platform);
    static availableBrowsers = [
        Browsers.Firefox,
        Browsers.Chrome,
        Browsers.Edge,
        Browsers.Chromium,
    ];
    static defaultDir = {
        windows: `${process.env.USERPROFILE}\\AppData\\Local\\ms-playwright`,
        linux: `${process.env.HOME}/.cache/ms-playwright`,
    };

    public getOS() {
        return this.os;
    }

    public async getBrowsers() {
        const browsers = this.getPlaywrightBrowsers().concat(await this.getSystemBrowsers());
        return browsers;
    }

    /**
     * Find available browsers in playwright default directory.
     */
    private getPlaywrightBrowsers(): unknown[] {
        let dir = '';
        switch (this.os) {
        case 'win32':
            dir = BrowserChecker.defaultDir.windows;
            break;
        case 'linux':
            dir = BrowserChecker.defaultDir.linux;
            break;
        }
        if (!dir) {
            return [];
        }
        const res: unknown[] = [];
        const files = readdirSync(dir);
        files.forEach((file) => {
            BrowserChecker.availableBrowsers.forEach((browser) => {
                if (file.includes(browser))
                    res.push({
                        browser: browser,
                        type: 'playwright',
                    });
            });
        });
        return res;
    }

    /**
     * Gets system browsers without checking versions.
     */
    private async getSystemBrowsers() {
        switch (this.os) {
        case 'linux':
            return await this.getBrowsersForLinux();
        }
    }

    private async getBrowsersForLinux(): Promise<unknown[]> {
        const browsers: unknown[] = [];
        for (let i = 0; i < BrowserChecker.availableBrowsers.length; i++) {
            const browser = BrowserChecker.availableBrowsers[i];
            console.log(`Checking ${browser}`);
            const result = await this.getBrowserForLinux(browser);
            if (result) {
                browsers.push({
                    browser: result,
                    type: 'system',
                });
            }
        }
        return browsers;
    }

    private async getBrowserForLinux(browser: string): Promise<string> {
        return new Promise(
            (resolve) => {
                exec(`which ${browser}`, (err) => {
                    if (!err) {
                        resolve(browser);
                    } else {
                        resolve('');
                    }
                });
            }
        );
    }
}