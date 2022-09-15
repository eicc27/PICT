import Koa from 'koa';
import Router from 'koa-router';
import websocket from 'ws';
import { Picture } from '../types/Types';
import BrowserChecker from '../utils/BrowserChecker';
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

let t = new Map<string, SQLColumnType>();
t.set('pid', { value: '100873280' });
let connection = new SQLiteConnector('PID', 'pixcrawl');
let uid = connection.selectAllWhenPropertyEqual(t)[0].uid;
let pname = connection.selectAllWhenPropertyEqual(t)[0].pname;
console.log(pname);
let t2 = new Map<string, SQLColumnType>();
t2.set('uid', { value: uid });
let uname = connection.switchToTable('UID').selectAllWhenPropertyEqual(t2)[0].uname;
console.log(uname);



const testParser = new DataParser(testPicture);
const testConnection = new SQLiteConnector('PID', 'pixcrawl');
testConnection.createTable(testParser.toPidTableMap());
testConnection.switchToTable('TAG').createTable(testParser.toTagTableMap()[0]);
testConnection.switchToTable('UID').createTable(testParser.toUidTableMap());
testConnection.switchToTable('URL').createTable(testParser.toUrlTableMap()[0]);


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