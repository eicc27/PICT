import Service from '@ember/service';

export default class PixcrawlService extends Service {
    socket = new WebSocket('ws://localhost:3000');

    /** @param {{type: string, value: string}[]} keywords */
    sendKeywords(keywords) {
        const that = this;
        if (this.socket.readyState == this.socket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'keyword', value: keywords }));
        } else {
            this.socket.onopen = function () {
                console.log('socket opened');
                that.socket.send(JSON.stringify({ type: 'keyword', value: keywords }));
            };
        }
    }

    recieveSearchResults(searchResults) {
        this.socket.onmessage = function (msg) {
            const data = JSON.parse(msg.data);
            if (data.type == 'keyword-total') {
                searchResults.updateTotal(data.value);
            } else {
                searchResults.add(data);
                searchResults.updateCount();
            }
            // console.log(data);
        }
    }

    sendSearchResults(urls) {
        const that = this;
        console.log('send search results');
        if (this.socket.readyState == this.socket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'index', value: urls }));
        } else {
            this.socket.onopen = function () {
                console.log('socket opened');
                that.socket.send(JSON.stringify({ type: 'index', value: urls }));
            };
        }
    }

    recieveIndexResults(indexResults) {
        const onmsg = function (msg) {
            try {
                const data = JSON.parse(msg.data);
                console.log(data);
                if (data.type == 'index-total') {
                    indexResults.updateTotal(data.value);
                } else if (data.type == 'index-decrease') {
                    indexResults.decreaseTotal();
                }
                else {
                    indexResults.adds(data.value);
                    indexResults.updateCount();
                }
            } catch(e) {
                console.log(msg.data);
            }
        };
        this.socket.onmessage = onmsg;
    }

    clear() {
        this.socket.onmessage = null;
    }

    sendDownloadRequests(indexResults) {
        const that = this;
        console.log('send search results');
        if (this.socket.readyState == this.socket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'download',
                value: indexResults,
            }));
        } else {
            this.socket.onopen = function () {
                that.socket.send('hello');
                console.log('socket opened');
                that.socket.send(JSON.stringify({
                    type: 'download',
                    value: indexResults,
                }));
            };
        }
    }

    recieveDownloadRequests(downloadResults) {
        this.socket.onmessage = function (msg) {
            const data = JSON.parse(msg.data);
            if (data.type == 'download-total') {
                downloadResults.updateTotal(data.value);
            } else {
                downloadResults.updateCount();
            }
            // console.log(data);
        }
    }

    close() {
        this.socket.close();
    }
}
