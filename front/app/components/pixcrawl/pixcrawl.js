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
     * `type` indicates the search type. `value` depends on back end.
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
            case 'search-uname':
                this.fillUname(resp.value);
                break;
        }
    }

    fillUid(value) {
        let index = value.index;
        let result = this.searchResults[index];
        if (!value.extended) {
            result.uname = value.value;
            result.avatar = value.avatar;
            result.extended = false;
            result.display = true;
            this.searchResults = copy(this.searchResults);
            // console.log(this.searchResults);
            return;
        }
        // else value.extended
        // the rest of the thing is done by clicking the triangle button.
        switch (this.keywords[index].type) {
            case 'uid':
                result.pictures = value.pictures;
                result.tags = value.tags;
                break;
            case 'uname':
                result.value[result.extendIndex].pictures = value.pictures;
                result.value[result.extendIndex].tags = value.tags;
        }
        this.searchResults = copy(this.searchResults);
        let triangle = document.querySelectorAll('.search li>button')[index];
        let hourglass = document.querySelectorAll('.search .hourglass')[index];
        let abstractResult = document.querySelectorAll(
            '.search .result-abstract'
        )[index];
        hourglass.style.display = 'none';
        triangle.style.display = 'block';
        abstractResult.style.background = 'rgba(0, 0, 0, 0.1)';
        let resultExtendedElement =
            document.querySelectorAll('.result-extended')[index];
        resultExtendedElement.classList.add('result-extended-show');
        triangle.children[0].style.transform = 'rotate(180deg)';
    }

    fillUname(value) {
        let index = value.index;
        if (!value.extended) {
            this.searchResults[index] = {
                extended: false,
                extendIndex: null,
                display: true,
                value: value.value,
            };
            for (let i = 0; i < this.searchResults[index].value.length; i++) {
                this.searchResults[index].value[i].extended = false;
                this.searchResults[index].value[i].pictures = [];
                this.searchResults[index].value[i].tags = [];
            }
        }
        this.searchResults = copy(this.searchResults);
        console.log(this.searchResults);
        let resultElement = document.querySelectorAll('.search li')[index];
        resultElement.style.display = 'flex';
    }

    deleteSearchOption = (index) => {
        // deletes keyword as well
        this.searchResults.splice(index, 1);
        this.searchResults = copy(this.searchResults);
        // 1, 2, 3 [delete index 2] -> 1, 3 [adjust index] -> 1, 2
        this.keywords.splice(index, 1);
        for (let i = index; i < this.keywords.length; i++) {
            this.keywords[i].index--;
        }
        this.keywords = copy(this.keywords);
        // console.log(this.searchResults);
        // the default display of the list items is hidden.

        this.toggleAddTagsHintVisibility();
    };

    toggleAddTagsHintVisibility() {
        // controls the hint visibility
        let hint = document.querySelector('.keyword .add-tags span');
        hint.style.display = this.keywords.length ? 'none' : 'block';
    }

    @action
    toggleDetailedSearchResult(index) {
        let resultExtendedElement =
            document.querySelectorAll('.result-extended')[index];
        let abstractResultElement = document.querySelectorAll(
            '.search .result-abstract'
        )[index];
        // shrink function
        let showClassName = 'result-extended-show';
        let triangle = document.querySelectorAll('.search li>button')[index];
        if (resultExtendedElement.classList.contains(showClassName)) {
            triangle.children[0].style.transform = 'rotate(-30deg)';
            resultExtendedElement.classList.remove(showClassName);
            abstractResultElement.style.background = 'transparent';
            return;
        }
        // expand function
        let searchedClassName = 'result-extended-searched';
        let hourglass = document.querySelectorAll('.search .hourglass')[index];
        triangle.children[0].style.transform = 'rotate(180deg)';
        abstractResultElement.style.background = 'rgba(0, 0, 0, 0.1)';
        resultExtendedElement.classList.add(showClassName);
        switch (this.keywords[index].type) {
            case 'uid':
                if (
                    !resultExtendedElement.classList.contains(searchedClassName)
                ) {
                    resultExtendedElement.classList.add(searchedClassName);
                    // shows the hourglass
                    triangle.style.display = 'none';
                    hourglass.style.display = 'block';
                    this.sendExtendedSearchRequest(index);
                }
                break;
            case 'uname':
                break;
        }
    }

    @action toggleDetailedUserInfo(kwdIndex, resultIndex) {
        let result = this.searchResults[kwdIndex];
        let triangle = document.querySelectorAll('.search li>button')[kwdIndex];
        if (!result.extended) {
            // ready for visual state change
            result.extended = true;
            result.extendIndex = resultIndex;
            this.searchResults = copy(this.searchResults);
            // console.log(this.searchResults);
            // gets keyword and send to backend
            let uid = result.value[resultIndex].uid;
            if (!result.value[resultIndex].extended) {
                // sets flag to 'already searched'
                this.searchResults[kwdIndex].value[resultIndex].extended = true;
                console.log(this.searchResults);
                this.send({
                    value: {
                        value: uid,
                        type: 'uid',
                        index: kwdIndex,
                    },
                    type: 'extendedSearch',
                });
                // visual state change for displaying hourglass
                let hourglass =
                    document.querySelectorAll('.search .hourglass')[kwdIndex];
                hourglass.style.display = 'block';
                triangle.style.display = 'none';
            }
            return;
        }
        // else result.extended
        result.extended = false;
        this.searchResults = copy(this.searchResults);
        triangle.children[0].style.transform = 'rotate(-30deg)';
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
                        display: false,
                        avatar: '',
                        uname: '',
                        pictures: [],
                        tags: [],
                    });
                    break;
                case 'uname':
                    this.searchResults.push({
                        value: [],
                        extended: false,
                        display: false,
                    });
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
