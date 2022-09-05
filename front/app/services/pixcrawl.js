import Service from '@ember/service';
import ENV from 'front/config/environment';



export default class PixcrawlService extends Service {
    socket = new WebSocket(ENV.WS_HOST);
    keywords;

    sendKwds(keywords) {
        // console.log('Socket successfully opened.');
        this.socket.send(JSON.stringify(keywords));
        console.log(keywords.type);
        if (keywords.type == 'search') {
            this.keywords = keywords.value;
            // console.log(this.keywords);
        }
        this.socket.onmessage = (msg) => {
            // console.log(msg.data);
            this.handle(msg.data);
        };
    }

    send(keywords) {
        if (this.socket.readyState == WebSocket.OPEN) {
            this.sendKwds(keywords);
        } else
            this.socket.onopen = () => {
                this.sendKwds(keywords);
            };
    }

    handle(msg) {
        let resp = JSON.parse(msg);
        switch (resp.type) {
            case 'search-uid':
                this.fillUid(resp.value);
                break;
        }
    }

    fillUid(value) {
        // console.log(value);
        if (!value.extended)
            this.fillUidAbstract(value);
        else {
            console.log('extended');
            this.fillUidExtended(value);
        }
    }

    fillUidAbstract(value) {
        this.updatePbar(value);
        let searchElement = document.querySelectorAll('.search li')[value.index];
        searchElement.style.display = 'flex';
        if (value.result == 1) {
            let resultElement = document.querySelectorAll('.search .search-result')[value.index];
            resultElement.style.display = 'none';
            searchElement.innerHTML += '<div class="search-error">No results found.</div>';
            // disables the click of the triangle
            // by adding a failure tag on it
            let triangle = document.querySelectorAll('.search .triangle-right')[value.index];
            triangle.classList.add('triangle-disabled');
            return;
        }
        // console.log(resultElement);
        let avatar = searchElement.querySelector('.result-abstract img');
        let uname = searchElement.querySelector('.result-abstract .value');
        avatar.setAttribute('src', value.avatar);
        uname.innerHTML = value['value'];
        // plus, update the progress bar
    }

    updatePbar(value) {
        // console.log(this.keywords.length);
        // updates progress bar which is 600 px in pixcrawl.css
        let bar = document.querySelector('.search .bar');
        bar.style.width = `${Math.round(600 * value.searchCnt / this.keywords.length)}px`;
        let percent = document.querySelector('.search .percent');
        percent.innerHTML = `${(100 * value.searchCnt / this.keywords.length).toFixed(2)}%`;
        let target = document.querySelector('.search .progress .search-target');
        if (value.searchCnt == this.keywords.length) {
            target.innerHTML = 'Completed.';
        } else {
            if (value.result == 1)
                target.innerHTML = `Searched ${value['value']}...`;
            else
                target.innerHTML = `Search failed...`;
        }
        let abstract = document.querySelector('.search .abstract-progress');
        if (value.result == 0) {
            let completed = abstract.querySelector('.completed');
            completed.innerHTML = `${parseInt(completed.innerHTML) + 1}`;
        } else {
            let failed = abstract.querySelector('.failed');
            failed.innerHTML = `${parseInt(failed.innerHTML) + 1}`;
        }
    }

    fillUidExtended(value) {
        let resultElement = document.querySelectorAll('.search li')[value.index];
        let extendedElement = resultElement.querySelector('.result-extended');
        // used to communicate with the function in pixcrawl.js(component)
        if (!extendedElement.classList.contains('result-extended-searched'))
            extendedElement.classList.add('result-extended-searched');
        let images = resultElement.querySelector('.result-extended .preview-imgs');
        let hourglass = document.querySelectorAll('.search .hourglass')[value.index];
        hourglass.style.display = 'none';
        let triangle = document.querySelectorAll('.search .triangle-right')[value.index];
        triangle.style.display = 'block';
        for (let i = 0; i < value.pictures.length; i++) {
            let picture = value.pictures[i];
            let img = document.createElement('img');
            img.setAttribute('alt', picture.title);
            img.setAttribute('title', picture.title);
            img.setAttribute('src', picture.content);
            images.appendChild(img);
        }
        let tagContents = resultElement.querySelector('.result-extended .tag-contents');
        for (let i = 0; i < value.tags.length; i++) {
            let tag = value.tags[i];
            if (this.isTagInKwds(tag)) {
                let tagIncluded = document.createElement('span');
                tagIncluded.classList.add('tag-included');
                tagIncluded.innerHTML = `#${tag}<span>√</span>`;
                tagContents.appendChild(tagIncluded);
            } else {
                let plus = document.createElement('span');
                plus.innerHTML = '+';
                let tagNew = document.createElement('button');
                tagNew.classList.add('tag-new');
                tagNew.setAttribute('type', 'button');
                tagNew.onclick = () => {
                    this.addTag(tag);
                }
                tagNew.innerHTML = `#${tag}<span>+</span>`;
                tagContents.appendChild(tagNew);
            }
        }
    }

    isTagInKwds(tagName) {
        for (let i = 0; i < this.keywords.length; i++) {
            let kwd = this.keywords[i];
            if (kwd.type != 'tag') continue;
            if (kwd.value == tagName) return true;
        }
        return false;
    }

    addTag(tag) {
        return;
    }
}
