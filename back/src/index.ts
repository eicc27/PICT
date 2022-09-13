import Koa from 'koa';
import Router from 'koa-router';
import websocket from 'ws';
import BrowserChecker from '../utils/BrowserChecker';
import SQLiteConnector, { SQLColumnType } from '../utils/DBConnector/SQLiteConnector';
import PixcrawlWSHandler from '../utils/PixcrawlWSHandler';
import ProxyListener from '../utils/ProxyListener';

const proxyListener = new ProxyListener();
proxyListener.listen();


let testKey: Map<string, SQLColumnType> = new Map();
testKey.set('name', {
    value: 'eric',
    ai: false,
    pri: false,
    nn: true,
    foreign: false
});
testKey.set('age', {
    value: 10,
    ai: false,
    pri: false,
    nn: true,
    foreign: false,
});
let connector = new SQLiteConnector<typeof testKey>('test', 'test');
// connector.createTable(testKey);
connector.insert(testKey);
let t = connector.selectAllWhenPropertyEqual(testKey);
console.log(t);

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

router.get('/download', async(ctx) => {
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