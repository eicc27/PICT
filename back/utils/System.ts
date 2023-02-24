import * as fs from "fs";
import httpsProxyAgent from "https-proxy-agent";
import { logfcall, LOGGER } from "./Logger.js";
import { DB_DIR, SQLITE_DB } from "./SQLite.js";

export const PLAYWRIGHT_DIR_WIN = `${process.env["HOME"]}/AppData/Local/ms-playwright`;
export const PLAYWRIGHT_DIR_LINUX = "~/.cache/ms-playwright";
export const PLATFORM = process.platform;

export class System {
    // used to initialize log level. cannot log function call.
    public static getSystemSettings() {
        return JSON.parse(fs.readFileSync("./settings/system.json").toString());
    }

    @logfcall() public static getPlaywrightBrowsers() {
        let dirs: string[] = [];
        switch (PLATFORM) {
            case "win32":
                try {
                    dirs = fs.readdirSync(PLAYWRIGHT_DIR_WIN);
                } catch (e) {
                    LOGGER.error("No playwright browser installation found");
                }
                break;
            case "linux":
                try {
                    dirs = fs.readdirSync(PLAYWRIGHT_DIR_LINUX);
                } catch (e) {
                    LOGGER.error("No playwright browser installation found");
                }
                break;
            default:
                throw new TypeError(
                    `Your type of machine (${PLATFORM}) is not supported.`
                );
        }
        const browsers: string[] = [];
        for (const dir of dirs) {
            if (dir.match(/chromium/gi)) {
                browsers.push("chromium");
            } else if (dir.match(/firefox/gi)) {
                browsers.push("firefox");
            }
        }
        return browsers;
    }

    /** Sets up an SQLite3 database, and changes `firstUse` to `false`. */
    @logfcall() public static initDatabase() {
        System.mkdir("../db");
        System.newFile(DB_DIR);
        SQLITE_DB.createTables();
        SYSTEM_SETTINGS.firstUse = false;
        fs.writeFileSync(
            "./settings/system.json",
            JSON.stringify(SYSTEM_SETTINGS, null, "\t")
        );
        LOGGER.ok("database creation successful");
    }

    /** Parses string with formatted strings. Coupled with files in `lang`.
     * @example // returns 'hello world'
     * languageParser('hello $1', 'world');
     */
    @logfcall() public static languageParser(
        template: string,
        ...args: unknown[]
    ) {
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
            fs.writeFileSync(fpath, "");
        }
    }

    @logfcall() public static exists(fpath: string) {
        try {
            fs.accessSync(fpath, fs.constants.F_OK);
            return true;
        } catch (e) {
            return false;
        }
    }

    @logfcall() public static async sleep(secs: number) {
        if (secs <= 0) return;
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(null);
            }, secs * 1000);
        });
    }
}

/** System wide settings. May change over runtime. */
export let SYSTEM_SETTINGS = System.getSystemSettings();
export let LANG = SYSTEM_SETTINGS.lang;
export let PROXY = httpsProxyAgent({
    host: "127.0.0.1",
    port: SYSTEM_SETTINGS.proxyPort,
});
export const HEADERS = {
    "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.52",
    referer: "https://www.pixiv.net",
};
