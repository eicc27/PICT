import axios from 'axios';
import chalk from 'chalk';
import httpsProxyAgent from 'https-proxy-agent';
import { platform } from 'os';
import Logger, { axiosErrorLogger, axiosResponseLogger, SigLevel } from '../utils/Logger';

/**
 * Uses a specific AJAX template to get the first page details of user
 * @param uid Pixiv User ID
 * @returns A concatenated template URL ready to query
 */
function getUserTopPage(uid: string) {
    return `https://www.pixiv.net/ajax/user/${uid}/profile/top?lang=zh`;
}

/**
 * Uses a specific AJAX template to get the all page overview of user
 * @param uid Pixiv User ID
 * @returns A concatenated template URL ready to query
 */
function getUserAllPage(uid: string) {
    return `https://www.pixiv.net/ajax/user/${uid}/profile/all?lang=zh`;
}

/**
 * Requires login. Uses Pixiv search system to get a uname result list.
 * @param uname User Name
 * @returns A concatenated template URL ready to query
 */
function searchUserPage(uname: string) {
    return `https://www.pixiv.net/search_user.php?nick=${uname}&s_mode=s_usr`;
}

/**
 * Gets tag translations and related tags.
 * @param tag Tag
 * @returns A concatenated template URL ready to query
 */
function searchTagPage(tag: string) {
    return encodeURI(`https://www.pixiv.net/ajax/search/artworks/${tag}?word=${tag}&order=date_d&mode=all&p=1&s_mode=s_tag&type=all&lang=zh`);
}

/**
 * Gets tag's featured picture('avatar').
 * @param tag Tag
 * @returns A concatenated template URL ready to query
 */
function searchTagAvatar(tag: string) {
    return encodeURI(`https://www.pixiv.net/ajax/search/tags/${tag}?lang=zh`);
}

/**
 * Gets the picture, tags and author by picture id.
 * @param pid Picture ID
 * @returns A concatenated template URL ready to query
 */
function searchPidPage(pid: string) {
    return `https://www.pixiv.net/artworks/${pid}`;
}

/**
 * Gets all original pictures(p0, p1, ...) url of a given pid.
 * @param pid picture ID
 * @returns A concatenated template URL ready to query
 */
function crawlPidPage(pid: string) {
    return encodeURI(`https://www.pixiv.net/ajax/illust/${pid}/pages?lang=zh`)
}

/**
 * Gets related pictures of a given tag sorted by hotness.
 * @param tag tags
 * @returns A concatenated template URL ready to query
 */
function getNavirankTagPage(tag: string) {
    return encodeURI(`https://pixiv.navirank.com/tag/${tag}`)
}

/**
 * Gets picture on Pixiv. Auto-sets referer & proxy agent. 
 * @param url the pixiv picture url
 * @returns base64-encoded picture if success, empty string if failed
 */
async function getPictureInBase64(url: string): Promise<string> {
    return new Promise((resolve) => {
        axios.get(url,
            { httpsAgent: ENV.PROXY_AGENT, headers: ENV.HEADER, responseType: 'arraybuffer' })
            .then((resp) => {
                axiosResponseLogger(url);
                let buffer = Buffer.from(resp.data, 'binary');
                resolve(ENV.BASE64_PREFIX + buffer.toString('base64'));
            }, (error) => {
                axiosErrorLogger(error, url);
                resolve('');
            });
    });
}

/**
 * Gets all original pids for a single pid.
 * @param pid picture ID
 * @returns A list of original picture ids the pid contains. Empty if error or not found.
 */
async function getOriginalPictureUrl(pid: string): Promise<string[]> {
    return new Promise(((resolve) => {
        (new Logger(`Getting original pictures of pid ${chalk.blueBright(pid)}`)).log();
        axios.get(ENV.PIXIV.USER.PID_SERIES(pid), { httpsAgent: ENV.PROXY_AGENT })
            .then((resp) => {
                axiosResponseLogger(ENV.PIXIV.USER.PID_SERIES(pid));
                let body = resp.data.body;
                let retVal = [];
                for (let i = 0; i < body.length; i++) {
                    let picture = body[i];
                    retVal.push(picture.urls.original);
                }
                if (retVal.length)
                    (new Logger(`Got ${chalk.blueBright(retVal.length)} picture(s).`)).log();
                else
                    (new Logger(`No picture found for ${chalk.yellowBright(pid)}!`, SigLevel.error)).log();
                resolve(retVal);
            }, (error) => {
                axiosErrorLogger(error, ENV.PIXIV.USER.PID_SERIES(pid));
                resolve([]);
            })
    }));
}

/**
 * Reflects results of network request
 */
enum RESULT { SUCCESS, FAILED };

/**
 * Tag Searching mode
 */
enum TAGMODE { NAVIRANK = "navirank", PREMIUM = "premium" };


const ENV = {

    MAX_PREVIEW_NUM: 3,

    BASE64_PREFIX: 'data:img/png;base64, ',

    /**
     * Pixiv template websites
     */
    PIXIV: {
        ROOT: 'https://www.pixiv.net',
        SETTINGS: 'https://www.pixiv.net/setting_user.php',
        USER: {
            TOP: getUserTopPage,
            ALL: getUserAllPage,
            UNAME: searchUserPage,
            TAG: searchTagPage,
            TAG_PICTURE: searchTagAvatar,
            PID: searchPidPage,
            PID_SERIES: crawlPidPage,
        },
        PICTURE_GETTER: getPictureInBase64,
        PID_GETTER: getOriginalPictureUrl,
        TAG_MODE: TAGMODE.NAVIRANK,
    },

    /**
     * Navirank template websites
     */
    NAVIRANK: {
        TAG: getNavirankTagPage,
    },

    /**
     * Basic settings controlled by user
     */
    SETTINGS: {
        MAX_PREVIEW_NUM: 3,
        MAX_RETRIAL: 3,
        PIC_CRED: 0.8,
        TAG_CRED: 100,
    },

    /**
     * An example header to fool Pixiv
     */
    HEADER: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.102 Safari/537.36 Edg/104.0.1293.70',
        'Referer': 'https://www.pixiv.net/'
    },

    /**
     * Automatically gets system proxy settings(only available when system proxy is used, instead of http proxy).
     *
     * This gracefully solves the core problem using NodeJS as back-end.
     */
    PROXY_AGENT: httpsProxyAgent(''),

    PLATFORM: platform(),

    /**
     * Stores browser-related info. Now supports only firefox.
     */
    BROWSER: {
        USER_PROFILE: 'C:\\Users\\13917\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\zestuc5g.default-default'
    }
}

export { ENV, RESULT, TAGMODE };