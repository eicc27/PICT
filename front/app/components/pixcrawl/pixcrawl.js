import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

function copy(jsonLike) {
    return JSON.parse(JSON.stringify(jsonLike));
}

function changeWidth(inputElement) {
    let inputContent = inputElement.value;
    let charContent = inputContent.match(/[\s\w]/g);
    let charContentLength = charContent ? charContent.length : 0;
    let nonCharContentLength = inputContent.length - charContentLength;
    inputElement.style.width = `${
        charContentLength * 8 + nonCharContentLength * 15
    }px`;
}

export default class PixcrawlComponent extends Component {
    /**
     * item example:
     * 
     * {
     * 
            type: 'uid',

            value: '',

            index: this.keywords.length,

            dropdown: [

                { tag: 'UID', desc: 'User ID' },

                { tag: 'PID', desc: 'Picture ID' },

                { tag: 'TAG', desc: 'Tag' },

                { tag: 'UNAME', desc: 'User Name' },

            ],

        }
        
     */
    @tracked
    keywords = [];

    /**
     * `type` indeicates the search type. `value` depends on back end.
     */
    @tracked
    searchResults = [];

    @tracked
    crawlResults = [];

    @service('pixcrawl')
    pixcrawlWS;

    send(keywords) {
        if (this.pixcrawlWS.socket.readyState == WebSocket.OPEN) {
            this.sendKwds(keywords);
        } else
            this.pixcrawlWS.socket.onopen = () => {
                this.sendKwds(keywords);
            };
    }

    sendKwds(keywords) {
        // console.log('Socket successfully opened.');
        this.pixcrawlWS.socket.send(JSON.stringify(keywords));
        this.pixcrawlWS.socket.onmessage = (msg) => {
            // console.log(msg.data);
            this.handle(msg.data);
        };
    }

    handle(msg) {
        let resp = JSON.parse(msg);
        switch (resp.type) {
            case 'search-uid':
                this.fillUid(resp.value);
                // this.updateProgress(resp.value);
                break;
        }
    }

    fillUid(value) {
        let index = value.index;
        let result = this.searchResults[index];
        if (!value.extended) {
            result.uname = value.value;
            result.avatar = value.avatar;
            let resultElement = document.querySelectorAll('.search li')[index];
            resultElement.style.display = 'flex';
            this.searchResults = copy(this.searchResults);
            // console.log(this.searchResults);
            return;
        }
        // the rest of the thing is done by clicking the triangle button.
        result.pictures = value.pictures;
        result.tags = value.tags;

        this.searchResults = copy(this.searchResults);
        let triangle = document.querySelectorAll('.search li>button')[index];
        let hourglass = document.querySelectorAll('.search .hourglass')[index];
        hourglass.style.display = 'none';
        triangle.style.display = 'block';
        let resultExtendedElement =
            document.querySelectorAll('.result-extended')[index];
        resultExtendedElement.classList.add('result-extended-show');
        triangle.children[0].style.transform = 'rotate(180deg)';
    }

    toggleAddTagsHintVisibility() {
        // controls the hint visibility
        let hint = document.querySelector('.keyword .add-tags span');
        hint.style.display = this.keywords.length ? 'none' : 'block';
    }

    @action
    toggleDetailedSearchResult(index) {
        let resultExtendedElement =
            document.querySelectorAll('.result-extended')[index];
        // shrink function
        let showClassName = 'result-extended-show';
        let triangle = document.querySelectorAll('.search li>button')[index];
        if (resultExtendedElement.classList.contains(showClassName)) {
            triangle.children[0].style.transform = 'rotate(-30deg)';
            resultExtendedElement.classList.remove(showClassName);
            return;
        }
        // expand function
        let searchedClassName = 'result-extended-searched';
        if (!resultExtendedElement.classList.contains(searchedClassName)) {
            let hourglass =
                document.querySelectorAll('.search .hourglass')[index];
            resultExtendedElement.classList.add(searchedClassName);
            // shows the hourglass
            triangle.style.display = 'none';
            hourglass.style.display = 'block';
            this.sendExtendedSearchRequest(index);
            return;
        }
        triangle.children[0].style.transform = 'rotate(180deg)';
        resultExtendedElement.classList.add(showClassName);
    }

    sendExtendedSearchRequest(index) {
        let request = this.keywords[index];
        this.send({ value: request, type: 'extendedSearch' });
    }

    @action
    highlightDiamond(index) {
        let diamondElement = document.getElementsByClassName('diamond')[index];
        diamondElement.classList.remove('diamond');
        diamondElement.classList.add('diamond-focus');
    }

    @action
    dimDiamond() {
        let diamondElement =
            document.getElementsByClassName('diamond-focus')[0];
        diamondElement.classList.remove('diamond-focus');
        diamondElement.classList.add('diamond');
    }

    @action
    showTagsIcon() {
        let tagsIconElement = document.querySelector(
            '.keyword .add-tags button'
        );
        let iconTags = tagsIconElement.lastElementChild;
        let iconTag = tagsIconElement.firstElementChild;
        iconTags.style.display = 'flex';
        iconTag.style.display = 'none';
    }

    @action
    hideTagsIcon() {
        let tagsIconElement = document.querySelector(
            '.keyword .add-tags button'
        );
        let iconTags = tagsIconElement.lastElementChild;
        let iconTag = tagsIconElement.firstElementChild;
        iconTags.style.display = 'none';
        iconTag.style.display = 'flex';
    }

    @action
    addTags() {
        let defaultTag = {
            type: 'uid',
            value: '',
            index: this.keywords.length,
            dropdown: [
                { tag: 'UID', desc: 'User ID' },
                { tag: 'PID', desc: 'Picture ID' },
                { tag: 'TAG', desc: 'Tag' },
                { tag: 'UNAME', desc: 'User Name' },
            ],
            extended: false,
        };
        this.keywords.push(defaultTag);
        this.keywords = copy(this.keywords);
        this.toggleAddTagsHintVisibility();
    }

    @action
    showDropdown(index) {
        let dropdown = document.querySelectorAll('.keyword .tag-dropdown')[
            index
        ];
        dropdown.style.display = 'flex';
        let tagTitle = document.querySelectorAll('.keyword .tag-name')[index];
        tagTitle.style.display = 'none';
    }

    @action
    hideDragdown(index) {
        let dropdown = document.querySelectorAll('.keyword .tag-dropdown')[
            index
        ];
        dropdown.style.display = 'none';
        let tagTitle = document.querySelectorAll('.keyword .tag-name')[index];
        tagTitle.style.display = 'block';
    }

    @action
    changeInputWidth(index) {
        let inputElement = document.querySelectorAll(
            '.keyword .tag-item input'
        )[index];
        // console.log(inputElement);
        // updates the keyword value
        let inputContent = inputElement.value;
        this.keywords[index].value = inputContent;
        changeWidth(inputElement);
    }

    @action
    changeTag(tag, index) {
        let tagContent = tag.toLowerCase();
        let kwd = this.keywords[index];
        let dropdown = kwd.dropdown;
        // changes tag of the kwd
        kwd.type = tagContent;
        // changes dropdown
        let i = 0;
        for (; i < dropdown.length; i++) {
            if (dropdown[i].tag == tag) break;
        }
        let currentTag = dropdown.splice(i, 1)[0];
        dropdown.unshift(currentTag);
        console.log(dropdown);
        // for the auto-refresh mechanism, style.display is not needed
        this.keywords = copy(this.keywords);
    }

    @action
    removeTag(index) {
        this.keywords.splice(index, 1);
        // manually update the index inside the keywords array
        for (let i = index; i < this.keywords.length; i++) {
            this.keywords[i].index--;
        }
        this.keywords = copy(this.keywords);
        this.toggleAddTagsHintVisibility();
    }

    @action
    fillTagContent(index) {
        let inputElement = document.querySelectorAll(
            '.keyword .tag-item input'
        )[index];
        inputElement.value = this.keywords[index].value;
        this.changeInputWidth(index);
    }

    @action showStep(index) {
        let stepElements = document.querySelector('.pixcrawl').children;
        for (let i = 1; i <= 4; i++) {
            stepElements[i].style.display = index == i ? 'flex' : 'none'; // send search requests
        }
    }

    @action goToSearch() {
        if (!this.checkKeywords()) return;
        this.showStep(2);
        // manually refresh search component loading
        this.keywords = copy(this.keywords);
        // generates abstract
        let abstract = document.querySelector('.pixcrawl .search .abstract');
        let cnt = {
            uid: 0,
            uname: 0,
            tag: 0,
            pid: 0,
        };
        for (let i = 0; i < this.keywords.length; i++) {
            cnt[this.keywords[i].type]++;
        }
        let sentences = [];
        if (cnt.uid) sentences.push(`<span>${cnt.uid}</span> user ids`);
        if (cnt.uname) sentences.push(`<span>${cnt.uname}</span> user names`);
        if (cnt.tag) sentences.push(`<span>${cnt.tag}</span> tags`);
        if (cnt.pid) sentences.push(`<span>${cnt.pid}</span> picture ids`);
        abstract.innerHTML = sentences.join(', ') + '.';
        // send keyword requests, using ws
        this.send({ value: this.keywords, type: 'search' });
        // reset progress
        // this.resetProgress();
        // setup search results types
        this.setupSearchResults();
    }

    setupSearchResults() {
        for (let i = 0; i < this.keywords.length; i++) {
            let keyword = this.keywords[i];
            switch (keyword.type) {
                case 'uid':
                    this.searchResults.push({
                        avatar: '',
                        uname: '',
                        pictures: [],
                        tags: [],
                    });
                    break;
            }
        }
    }

    checkKeywords() {
        let hint = document.querySelector('.hint');
        hint.style.display = 'none';
        let errorIndex = [];
        let errorType = {
            null: false,
            empty: false,
            nonnumber: false,
        };
        let result = true;
        // not null
        if (!this.keywords.length) {
            result = false;
            errorType.null = true;
        }
        for (let i = 0; i < this.keywords.length; i++) {
            let keyword = this.keywords[i];
            // not empty
            if (keyword.value == '') {
                errorIndex.push(i);
                errorType.empty = true;
                result = false;
            }
            // pure number
            else if (keyword.type == 'uid' || keyword.type == 'pid') {
                let value = keyword.value;
                if (
                    !value.match(/[0-9]/g) ||
                    value.match(/[0-9]/g).length != value.length
                ) {
                    errorIndex.push(i);
                    errorType.nonnumber = true;
                    result = false;
                }
            }
        }
        // shows debug info
        let info = [];
        if (errorType.null) info.push('No keywords specified.');
        if (errorType.empty) info.push('At least one keyword is empty.');
        if (errorType.nonnumber)
            info.push('At least one PID or UID is not pure number.');
        if (info.length) {
            let hint = document.querySelector('.hint');
            hint.style.display = 'block';
            let hintContent = document.querySelector('.hint .content');
            hintContent.innerHTML = info.join(' ');
        }
        // highlights error tags
        let tags = document.querySelectorAll('.keyword .main .tag-item');
        for (let i = 0; i < errorIndex.length; i++) {
            let index = errorIndex[i];
            let tag = tags[index];
            // refreshes animation
            tag.style.animation =
                'tagitem-highlight 0.2s ease-out forwards, tagitem-dim 0.2s 5.2s ease-out forwards';
        }
        return result;
    }

    @action
    hideHint() {
        let hint = document.querySelector('.hint');
        hint.style.display = 'none';
    }

    @action
    cancelTagHighlight(index, event) {
        // proved to be useful!
        // console.log(event, index);
        if (event.animationName == 'tagitem-dim') {
            let tag = document.querySelectorAll('.keyword .main .tag-item')[
                index
            ];
            tag.style.animation = 'none';
        }
    }

    @action
    addNewTagInSearch(tag) {}
}
