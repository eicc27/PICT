import { exec } from 'child_process';
import { readdirSync } from 'fs';
import Browsers from '../config/browsers';


/**  Pre-checks browsers for playwright.
* Chromium, Chrome & Edge can use native versions.
* Firefox must use shipped versions.
* https://playwright.dev/docs/browsers
* 
* Version list of browsers:
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

    static programFilesDir = {
        x64: 'C:\\Program Files\\',
        x86: 'C:\\Program Files (x86)\\'
    }

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
            case 'win32':
                return await this.getBrowersForWindows();
        }
    }

    private pushAvailableBrowsersOnWindows(browsers: unknown[], browserVendorName: string, browserLocation: String) {
        if (browserLocation.includes(browserVendorName))
            browsers.push({
                browser: browserVendorName.toLowerCase(),
                type: 'system',
            });
    }

    private async getBrowersForWindows() {
        const browserLocations = ['Google\\Chrome', 'Mozilla Firefox', 'Microsoft\\Edge'];
        let availableLocations: string[] = [];
        browserLocations.forEach(location => {
            availableLocations.push(BrowserChecker.programFilesDir.x86.concat(location),
                BrowserChecker.programFilesDir.x64.concat(location));
        });
        const browsers: unknown[] = [];
        for (let i = 0; i < availableLocations.length; i++) {
            const location = availableLocations[i];
            let result = await this.getBrowserForWindows(location);
            if (result) {
                this.pushAvailableBrowsersOnWindows(browsers, 'Chrome', location);
                this.pushAvailableBrowsersOnWindows(browsers, 'Firefox', location);
                this.pushAvailableBrowsersOnWindows(browsers, 'Edge', location);
            }
            
        }
        return browsers;
    }

    private async getBrowserForWindows(browserLocation: string): Promise<boolean> {
        return new Promise(
            (resolve) => {
                exec(`cd ${browserLocation}`, (err) => {
                    if (!err)
                        resolve(true);
                    else
                        resolve(false);
                })
            }
        )
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