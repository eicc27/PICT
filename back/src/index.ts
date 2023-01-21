import Koa from 'koa';
import Router from 'koa-router';
import cors from 'koa2-cors';
import * as fs from 'fs';
import { LANG, PLATFORM, System } from '../utils/System.js';
import { SQLITE_DB } from '../utils/SQLite.js';
import * as ws from 'ws';
import koaBody from 'koa-body';
import { SocketJobDispatcher } from '../socket/SocketDispatcher.js';
import { PIXCRAWL_DATA } from './pixcrawl.js';
import { LOGGER } from '../utils/Logger.js';

const app = new Koa();
app.use(koaBody.koaBody({
    multipart: true,
}));
const router = new Router();

router.get('/system', async (ctx) => {
    LOGGER.info('GET /system');
    const langFile = JSON.parse(fs.readFileSync(`./lang/${LANG}/home.json`).toString()).system;
    const systemSettings = System.getSystemSettings();
    let msgs: string[] = [];
    if (systemSettings.firstUse) {
        msgs.push(System.languageParser(langFile.is_firsttime));
        System.initDatabase();
    }
    const browsers = System.getPlaywrightBrowsers();
    if (!browsers.length) {
        msgs.push(System.languageParser(langFile.no_browser, PLATFORM));
    } else {
        msgs.push(System.languageParser(langFile.has_browser, PLATFORM, browsers.join(', ')));
    }
    const counts = SQLITE_DB.countPictures();
    if (!counts[0]) {
        msgs.push(System.languageParser(langFile.no_picture));
    } else {
        msgs.push(System.languageParser(langFile.has_picture, counts[0], counts[1]));
    }
    ctx.response.body = {
        msg: msgs.join('')
    };
});

router.post('/saveProgress', async (ctx) => {
    LOGGER.info('POST /saveProgress');
    const data = ctx.request.body;
    PIXCRAWL_DATA.setProgress(data.progress);
    PIXCRAWL_DATA.clearKeywords();
    for (const keyword of data.keywords)
        PIXCRAWL_DATA.addKeywords(keyword);
});

router.get('/loadProgress', async (ctx) => {
    LOGGER.info('GET /loadProgress');
    ctx.response.body = {
        progress: PIXCRAWL_DATA.getProgress(),
        keywords: PIXCRAWL_DATA.getKeywords(),
        searchResults: PIXCRAWL_DATA.getSearchData(),
        indexResults: PIXCRAWL_DATA.getIndexData(),
        downloadResults: PIXCRAWL_DATA.getDownloadData(),
    }
});

const httpServer = app.use(cors())
    .use(router.routes())
    .listen(3000);
let connections = 0;
const wsServer = new ws.WebSocketServer({ server: httpServer });
wsServer.on('connection', function (ws) {
    LOGGER.ok('connection established');
    connections++;
    if (connections > 1) {
        LOGGER.warn('Max connection excedeed');
        ws.close();
    }
    PIXCRAWL_DATA.setSocket(ws);
    ws.on('message', async function (msg) {
        LOGGER.info(msg);
        if (ws.readyState == this.CLOSED) {
            connections--;
            LOGGER.info('Socket closed');
        }
        if (typeof msg == 'object')
            await new SocketJobDispatcher(msg.toString(), ws).dispatch();
    });
});
LOGGER.ok('Server is now ON. Listening at port 3000.');
