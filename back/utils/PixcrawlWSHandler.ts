import { WebSocket } from 'ws';
import AsyncPool from './AsyncPool';
import SearchUIDHandler from './SearchHandler/SearchUIDHandler';

export default class PixcrawlWSHandler {
    private data: any;
    private ws: WebSocket;
    private searchCnt = 0;

    constructor(msg: any, ws: WebSocket) {
        this.data = msg;
        this.ws = ws;
    }

    public handle() {
        if (this.data.type == 'search')
            return this.search();
    }

    private async search() {
        // http://127.0.0.1/32345
        // let settings = await getProxySettings(); 
        // this.ws.send(`proxy settings: ${settings.https}`);
        this.searchCnt = 0;
        let pool = new AsyncPool(4);
        let kwds = this.data.value;
        for (let i = 0; i < kwds.length; i++) {
            let kwd = kwds[i];
            switch (kwd.type) {
                case 'uid':
                    await pool.submit(this.searchForUid(kwd.value, i));
                    break;
                case 'pid':
                    break;
            }
        }
        await pool.close();
    }

    private async searchForUid(value: string, index: number) {
        let handler = new SearchUIDHandler(value);
        let search = await handler.search();
        search.index = index;
        search.searchCnt = ++this.searchCnt;
        this.ws.send(JSON.stringify(search));
        let extendedSearch = await handler.extendedSearch();
        this.ws.send(JSON.stringify(extendedSearch));
    }
}