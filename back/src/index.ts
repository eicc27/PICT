import Koa from 'koa';
import Router from 'koa-router';
import websocket from 'ws';
import { Picture } from '../types/Types';
import BrowserChecker from '../utils/BrowserChecker';
import MongoBinGetter from '../utils/DBConnector/Mongo/MongoBinGetter';
import MongoConnector from '../utils/DBConnector/Mongo/MongoConnector';
import SQLiteConnector, { SQLColumnType } from '../utils/DBConnector/SQLiteConnector';
import DataParser from '../utils/DownloadHandler/DataParser';
// import SQLiteConnector, { SQLColumnType } from '../utils/DBConnector/SQLiteConnector';
import PixcrawlWSHandler from '../utils/PixcrawlWSHandler';
import ProxyListener from '../utils/ProxyListener';

/** Creates table first */
const testPicture: Picture = {
    pid: '',
    pname: '',
    uid: '',
    uname: '',
    tags: [''],
    originalUrls: ['']
};

const testParser = new DataParser(testPicture);
const testConnection = new SQLiteConnector('PID', 'pixcrawl');
testConnection.createTable(testParser.toPidTableMap());
testConnection.switchToTable('TAG').createTable(testParser.toTagTableMap()[0]);
testConnection.switchToTable('UID').createTable(testParser.toUidTableMap());
testConnection.switchToTable('URL').createTable(testParser.toUrlTableMap()[0]);

// new MongoBinGetter().getMongoLatest();

// sync mongo with sqlite (sqlite -> mongo)
// let picturesInSql = SQLiteConnector.toPictures();
// await (new MongoConnector(picturesInSql)).insert();


const proxyListener = new ProxyListener();
proxyListener.listen();

const app = new Koa();
const router = new Router();
router.get('/check-browser', async (ctx) => {
    const checker = new BrowserChecker();
    // console.log(await checker.getBrowsers());
    ctx.body = {
        system: checker.getOS(),
        browsers: await checker.getBrowsers(),
    };
});

router.get('/download', async (ctx) => {
    ctx.body = 'success';
});

app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', ctx.headers.origin);
    ctx.set('Access-Control-Allow-Headers', 'content-type');
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS,GET,HEAD,PUT,POST,DELETE,PATCH');
    await next();
});


app.use(router.routes());

app.listen(3000);

const socket = new websocket.Server({ port: 3001 });
socket.on('connection', (ws) => {
    ws.onmessage = async (msg) => {
        const data = JSON.parse(msg.data.toLocaleString());
        const handler = new PixcrawlWSHandler(data, ws);
        await handler.handle();
    };
});