import * as fs from 'fs';
import { logfcall, LOGGER } from './Logger.js';
import { DB_DIR, SQLite } from './SQLite.js';

export const PLAYWRIGHT_DIR_WIN = `${process.env['HOME']}/AppData/Local/ms-playwright`;
export const PLAYWRIGHT_DIR_LINUX = "~/.cache/ms-playwright";
export const PLATFORM = process.platform;

export class System {
    @logfcall() public static getSystemSettings() {
        return JSON.parse(fs.readFileSync('./settings/system.json').toString());
    }

    @logfcall() public static getPlaywrightBrowsers() {
        let dirs: string[] = [];
        switch (PLATFORM) {
            case 'win32':
                dirs = fs.readdirSync(PLAYWRIGHT_DIR_WIN);
                break;
            case 'linux':
                dirs = fs.readdirSync(PLAYWRIGHT_DIR_LINUX);
                break;
            default:
                throw new TypeError(`Your type of machine (${PLATFORM}) is not supported.`);
        }
        const browsers: string[] = [];
        for (const dir of dirs) {
            if (dir.match(/chromium/ig)) {
                browsers.push('chromium');
            }
            else if (dir.match(/firefox/ig)) {
                browsers.push('firefox');
            }
        }
        return browsers;
    }

    /** Sets up an SQLite3 database, and changes `firstUse` to `false`. */
    @logfcall() public static initDatabase() {
        System.mkdir('../db');
        System.newFile(DB_DIR);
        new SQLite().createTables();
        SYSTEM_SETTINGS.firstUse = false;
        fs.writeFileSync('./settings/system.json', JSON.stringify(SYSTEM_SETTINGS, null, '\t'));
        LOGGER.ok('database creation successful');
    }

    /** Parses string with formatted strings. Coupled with files in `lang`.
     * @example // returns 'hello world' 
     * languageParser('hello $1', 'world');
     */
    @logfcall() public static languageParser(template: string, ...args: unknown[]) {
        const placeholders = template.match(/\$[0-9]+/g);
        if (!placeholders) return template;
        for (const placeholder of placeholders) {
            const index = parseInt(placeholder.slice(1));
            template = template.replace(placeholder, String(args[index - 1]));
        }
        return template;
    }

    @logfcall() public static mkdir(fpath: string) {
        try {
            fs.accessSync(fpath, fs.constants.F_OK);
        } catch (e) {
            fs.mkdirSync(fpath);
        }
    }

    @logfcall() public static newFile(fpath: string) {
        try {
            fs.accessSync(fpath, fs.constants.F_OK);
        } catch (error) {
            fs.writeFileSync(fpath, '');
        }
    }
}

/** System wide settings. May change over runtime. */
export let SYSTEM_SETTINGS = System.getSystemSettings();
export let LANG = SYSTEM_SETTINGS.lang;