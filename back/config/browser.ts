import { readFileSync } from 'fs';

const BROWSER_CONFIG_PATH = './data/browser.json';

/**
 * WARNING: Chrome is not supported on Linux. Use Chromium instead.
 */
export default class Browser {
    private type: string;
    private execPath: string;
    private profileDir: string;

    constructor () {
        const browser = JSON.parse(readFileSync(BROWSER_CONFIG_PATH, {encoding: 'utf-8'}));
        this.type = browser.type;
        this.execPath = browser.execPath;
        this.profileDir = browser.profileDir;
    }

    /**
     * Gets the browser's type. Mind that this function returns `Browsers`-string type, 
     * in which the browser name is lower-case.
     * @returns `Browsers.string`
     */
    public getType() {
        return this.type;
    }

    /**
     * Gets the browser's displayed name. The first letter is upper-case.
     * @returns the literal name of the browser
     */
    public getName() {
        return this.type[0].toUpperCase() + this.type.substring(1);
    }

    public getExecPath() {
        return this.execPath;
    }

    public getProfileDir() {
        return this.profileDir;
    }

    public getProfileName() {
        if (process.platform == 'win32')
            return this.profileDir.split('\\').pop();
        return this.profileDir.split('/').pop();
    }
}