import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';

const copy = (object) => JSON.parse(JSON.stringify(object));

function buf2ab(buffer) {
    const ab = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
    }
    return view;
}

export default class PixcrawlService extends Service {
    socket = new WebSocket('ws://localhost:3000');
    @tracked keywords = A([]);
    @tracked step = 'keyword';
    @tracked working = false;
    @tracked connected = false;
    @tracked progress = 0;
    intervalfn = null;

    listen() {
        this.intervalfn = setInterval(() => {
            this.connected = this.socket.readyState == this.socket.OPEN;
            // console.log('hb');
        }, 1000);
    }

    detach() {
        clearInterval(this.intervalfn);
    }

    addKeyword(keyword) {
        this.keywords.pushObject(keyword);
    }

    getKeyword(index) {
        return this.keywords.get(index);
    }

    setKeywordType(index, type) {
        const keyword = this.keywords.get(index);
        keyword.type = type;
        this.keywords.set(index, copy(keyword));
        this.keywords = copy(this.keywords);
    }

    setKeywordValue(index, value) {
        const keyword = this.keywords.get(index);
        keyword.value = value;
        this.keywords.set(index, copy(keyword));
    }

    /** Clears keywords with identical type and value. */
    clearRepeatingKeywords() {
        for (let i = 0; i < this.keywords.length; i++) {
            const keyword = this.keywords[i];            
            for (let j = i + 1; j < this.keywords.length; j++) {
                const target = this.keywords[j];
                if (keyword.type == target.type && keyword.value == target.value) {
                    this.keywords.splice(j, 1);
                }
            }
        }
        this.keywords = copy(this.keywords);
    }

    /** 0 for OK, 1 for empty, 2 for missing, 3 for type error, auto-clear repeating keywords */
    checkKeyword() {
        const value = {};
        if (!this.keywords.length) return 1;
        for (let i = 0; i < this.keywords.length; i++) {
            const keyword = this.keywords[i];
            if (!keyword.value.length) value[i] = 2;
            else if (keyword.type == 'pid' || keyword.type == 'uid') {
                if (
                    keyword.value.match(/[0-9]/g).length != keyword.value.length
                )
                    // !isalnum
                    value[i] = 3;
            }
        }
        if (!Object.keys(value).length) return 0;
        return value;
    }

    sendSearchRequest() {
        this.prorgess = 0;
        this.working = true;
        this.socket.send(
            JSON.stringify({ type: 'keyword', value: this.keywords })
        );
        const that = this;
        this.step = 'search';
        let i = 0;
        const total = this.keywords.length;
        let progress = 0;
        /** recieve search data */
        this.socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log(data);
            i++;
            if (i == that.keywords.length) {
                that.working = false;
                console.log(that.pictures);
            }
            const index = data.index;
            // expand search results
            const keywordElement = document.querySelectorAll('.keyword')[index];
            console.log(keywordElement);
            keywordElement.classList.add('expand');
            const searchContainerElement =
                document.querySelectorAll('.search-container')[index];
            searchContainerElement.classList.add('show');
            // fill in avatars
            const blob = new Blob([buf2ab(data.avatar.data)], {
                type: 'image/png',
            });
            const imageElement = document.querySelectorAll(
                '.keyword .avatar >img'
            )[index];
            imageElement.setAttribute('src', window.URL.createObjectURL(blob));
            // fill in desc elements
            const descElement = document.querySelectorAll(
                '.search-container .desc'
            )[index];
            let desc = '';
            that.keywords[index].length = data.pictures.length;
            progress++;
            that.progress = (progress / total * 100).toFixed(1);
            switch (data.type) {
                case 'uid':
                    desc = data.uname;
                    break;
                case 'tag':
                    desc = `预计${data.pictures.length}张图片`;
                    break;
            }
            descElement.innerHTML = desc;
        };
    }

    clear() {
        this.progress = 0;
        this.keywords.clear();
        this.step = 'keyword';
        this.socket.send(JSON.stringify({ type: 'clear' }));
    }

    getPictureLength() {
        let length = 0;
        for (const keyword of this.keywords) {
            length += keyword.length;
        }
        return length;
    }

    sendIndexRequest() {
        this.progress = 0;
        const that = this;
        const total = this.getPictureLength();
        let progress = 0;
        this.working = true;
        this.socket.send(JSON.stringify({ type: 'index' }));
        this.socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'index':
                    let index = data.index;
                    progress++;
                    that.progress = (progress / total * 100).toFixed(1);
                    that.keywords[index].length += data.total - 1;
                    break;
                case 'index-complete':
                    that.sendDownloadRequest();
                    break;
            }
        };
    }

    sendDownloadRequest() {
        this.progress = 0;
        this.step = 'download';
        const that = this;
        const total = this.getPictureLength();
        let progress = 0;
        this.socket.send(JSON.stringify({ type: 'download' }));
        this.socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'download':
                    progress++;
                    that.progress = (progress / total * 100).toFixed(1);
                    break;
                case 'download-complete':
                    that.working = false;
                    break;
            }
        }
    }
}
