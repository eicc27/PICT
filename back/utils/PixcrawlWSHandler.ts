import axios from 'axios';
import WebSocket = require('ws');
import ENV from '../config/environment';

export default class PixcrawlWSHandler {
    private data;
    private ws: WebSocket;

    constructor(msg: any, ws: WebSocket) {
        this.data = msg;
        this.ws = ws;
    }

    public handle() {
        if (this.data.type == 'search')
            return this.search();
    }

    private search() {
        this.data.value.forEach((kwd: any) => {
            switch (kwd.type) {
                case 'uid':
                    this.searchForUid(kwd.value);
            }
        });
    }

    private searchForUid(value: string) {
        axios.get(`https://www.pixiv.net/users/${value}`, { httpsAgent: ENV.AGENT })
            .then((resp) => {
                //console.log(resp.status);
                let html: string = resp.data;
                let title = html.slice(html.indexOf('<title>') + '<title>'.length, html.indexOf('</title>') - ' - pixiv'.length);
                this.ws.send(`Matching result found: ${value} - ${title}`);
            }, (error) => {
                console.log(error);
                this.ws.send(`No matching results for ${value}.`);
            });
    }
}