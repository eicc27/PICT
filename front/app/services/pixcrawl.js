import Service from '@ember/service';
import ENV from 'front/config/environment';

export default class PixcrawlService extends Service {
    socket = new WebSocket(ENV.WS_HOST);

    sendSearchKwds(keywords) {
        console.log('Socket successfully opened.');
        this.socket.send(JSON.stringify({ value: keywords, type: 'search' }));
        this.socket.onmessage = (msg) => {
            this.handle(JSON.parse(msg.data));
        };
    }

    search(keywords) {
        if (this.socket.readyState == WebSocket.OPEN) {
            this.sendSearchKwds(keywords);
        } else
            this.socket.onopen = () => {
                this.sendSearchKwds(keywords);
            };
    }

    handle(msg) {
        console.log(msg);
    }
}
