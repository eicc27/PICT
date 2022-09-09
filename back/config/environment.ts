import axios from 'axios';
import httpsProxyAgent from 'https-proxy-agent';
import { platform } from 'os';
import { axiosErrorLogger, axiosResponseLogger } from '../utils/Logger';

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

function searchUserPage(uname: string) {
    return `https://www.pixiv.net/search_user.php?nick=${uname}&s_mode=s_usr`;
}

function searchTagPage(tag: string) {
    return encodeURI(`https://www.pixiv.net/ajax/search/artworks/${tag}?word=${tag}&order=date_d&mode=all&p=1&s_mode=s_tag&type=all&lang=zh`);
}

function searchTagAvatar(tag: string) {
    return encodeURI(`https://www.pixiv.net/ajax/search/tags/${tag}?lang=zh`);
}

function searchPidPage(pid: string) {
    return `https://www.pixiv.net/artworks/${pid}`;
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
 * Reflects results of network request
 */
enum RESULT { SUCCESS, FAILED };

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
            URL: 'https://www.pixiv.net/users/',
            TOP: getUserTopPage,
            ALL: getUserAllPage,
            UNAME: searchUserPage,
            TAG: searchTagPage,
            TAG_PICTURE: searchTagAvatar,
            PID: searchPidPage,
        },
        PICTURE_GETTER: getPictureInBase64,
    },

    /**
     * Basic settings controlled by user
     */
    SETTINGS: {
        MAX_THUMBNAIL_NUM: 3,

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

export { ENV, RESULT };