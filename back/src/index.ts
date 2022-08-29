import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as websocket from 'ws';
import ENV from '../config/environment';
import BrowserChecker from '../utils/BrowserChecker';
import NetworkChecker from '../utils/NetworkChecker';
import PixcrawlWSHandler from '../utils/PixcrawlWSHandler';
// import Test from '../utils/Test';

const app = new Koa();
const router = new Router();
router.get('/check-browser', async (ctx) => {
    const checker = new BrowserChecker();
    console.log(await checker.getBrowsers());
    ctx.body = {
        system: checker.getOS(),
        browsers: await checker.getBrowsers(),
    };
});

router.get('/download', async(ctx) => {
    ctx.body = 'success';
});

router.get('/browser-info', (ctx) => {
    ctx.body = {
        name: ENV.BROWSER.getName(),
        profile: ENV.BROWSER.getProfileName()
    };
});

const networkChecker = new NetworkChecker();

router.get('/check-network', async (ctx) => {
    ctx.body = await networkChecker.checkNetworkStaus();
});

router.get('/check-account', async (ctx) => {
    ctx.body = await networkChecker.checkLoginStatus();
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
    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data.toLocaleString());
        const handler = new PixcrawlWSHandler(data, ws);
        ws.send(handler.handle());
    };
});