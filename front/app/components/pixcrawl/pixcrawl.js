import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { action } from '@ember/object';

class SearchProgress {
    nums = {
        uid: 0,
        uname: 0,
        pid: 0,
        tag: 0,
    };
    searchCnt = 0;
    success = 0;
    failure = 0;
}

class SearchUIDResult {
    success = false;
    elementState = {
        expand: false,
        searching: false,
        display: false,
    };
    extended = false;
    avatar = '';
    uname = '';
    pictures = [''];
    tags = [''];
}

class SearchUIDResponse {
    extended = false;
    result = 0;
    value = '';
    avatar = '';
    index = 0;
    searchCnt = 0;
}

class SearchUIDExtendedResponse {
    extended = true;
    result = 0;
    pictures = [
        {
            title: '',
            content: '',
        },
    ];
    tags = [''];
    index = 0;
}

class SearchUNameResult {
    success = false;
    elementState = {
        expand: false,
        searching: false,
        display: false,
    };
    extended = false;
    extendIndex = 0;
    value = [
        {
            extended: false,
            avatar: '',
            uname: '',
            uid: '',
            pictures: [''],
            tags: [''],
        },
    ];
}

class SearchUNameResponse {
    extended = false;
    result = 0;
    index = 0;
    searchCnt = 0;
    value = [
        {
            uname: '',
            uid: '',
            avatar: '',
        },
    ];
}

class SearchTagResult {
    success = false;
    elementState = {
        expand: false,
        searching: false,
        display: false,
    };
    extendIndex = 0;
    value = [
        {
            extended: false,
            tag: '',
            translate: '',
            avatar: '',
        },
    ];
}

class SearchTagResponse {
    result = 0;
    index = 0;
    searchCnt = 0;
    value = [
        {
            tag: '',
            translation: '',
            avatar: '',
        },
    ];
}

class SearchTagExtendedResponse {
    result = 0;
    index = 0;
    avatar = '';
}

class SearchPIDResult {
    success = false;
    elementState = {
        expand: false,
        searching: false,
        display: false,
        originalPicture: false,
    };
    extended = false;
    pname = '';
    avatar = '';
    original = '';
    tags = [];
    author = {
        uname: '',
        uid: '',
        avatar: '',
    };
}

class SearchPIDResponse {
    extended = false;
    result = 0;
    avatar = '';
    index = 0;
    searchCnt = 0;
    tags = [];
    pname = '';
    author = {
        uname: '',
        uid: '',
        avatar: '',
    };
}

class SearchPIDExtendedResponse {
    index = 0;
    extended = true;
    result = 0;
    picture = '';
}

class KeywordType {
    type = '';
    value = '';
    index = 0;
    dropdown = [
        {
            tag: '',
            desc: '',
        },
    ];
}

class SearchRequestType {
    /** @type {KeywordType | KeywordType[]} value */
    value;

    /** @type {string} type */
    type;
}

function copy(jsonLike) {
    return JSON.parse(JSON.stringify(jsonLike));
}

function changeWidth(inputElement) {
    let inputContent = inputElement.value;
    let charContent = inputContent.match(/[\s\w]/g);
    let charContentLength = charContent ? charContent.length : 0;
    let nonCharContentLength = inputContent.length - charContentLength;
    inputElement.style.width = `${charContentLength * 8 + nonCharContentLength * 15
        }px`;
}

export default class PixcrawlComponent extends Component {

    @tracked
    steps = {
        keyword: true,
        search: false,
        crawl: false,
        download: false,
    }

    /** @type {KeywordType[]} */
    @tracked
    keywords = [];

    /** @type {SearchUIDResult[] | SearchUNameResult[] | SearchTagResult[] | SearchPIDResult[]} */
    @tracked
    searchResults = [];

    @tracked
    crawlResults = [];

    @tracked
    searchProgress = new SearchProgress();

    @service('pixcrawl')
    pixcrawlWS;

    /** @param {SearchRequestType} keywords */
    send(keywords) {
        if (this.pixcrawlWS.socket.readyState == WebSocket.OPEN) {
            this.sendKwds(keywords);
        } else
            this.pixcrawlWS.socket.onopen = () => {
                this.sendKwds(keywords);
            };
    }

    /** @param {KeywordType[] | KeywordType} keywords */
    sendKwds(keywords) {
        // console.log('Socket successfully opened.');
        this.pixcrawlWS.socket.send(JSON.stringify(keywords));
        this.pixcrawlWS.socket.onmessage = (msg) => {
            // console.log(msg.data);
            this.handle(msg.data);
        };
    }

    /** Updates the search progress controller */
    updateSearchProgress(resp) {
        ++this.searchProgress.searchCnt;
        if (!resp.value.result) {
            ++this.searchProgress.success;
        } else {
            ++this.searchProgress.failure;
        }
        this.searchProgress = copy(this.searchProgress);
    }

    handle(msg) {
        let resp = JSON.parse(msg);
        if (!resp.value.extended) this.updateSearchProgress(resp);
        // console.log(resp);
        // handles searchProgress changes
        switch (resp.type) {
            case 'search-uid':
                this.fillUid(resp.value);
                // this.updateProgress(resp.value);
                break;
            case 'search-uname':
                this.fillUname(resp.value);
                break;
            case 'search-tag':
                this.fillTag(resp.value);
                break;
            case 'search-pid':
                this.fillPid(resp.value);
                break;
        }
    }

    toggleAddTagsHintVisibility() {
        let hintElement = document.querySelector('.keyword .add-tags>span');
        hintElement.style.display = this.keywords.length ? 'none' : 'flex';
    }

    /** @param {number} index */
    @action goBack(index) {
        let hint = document.querySelector('.hint');
        switch (index) {
            case 0:
                if (document.querySelector('.keyword').style.display == 'flex') return;
                if (this.searchProgress.searchCnt < this.keywords.length) {
                    hint.style.display = 'block';
                    let hintContent = document.querySelector('.hint .content');
                    hintContent.innerHTML = "Please wait for the search to complete.";
                    return;
                }
                this.steps.search = false;
                this.steps.crawl = false;
                this.steps.download = false;
                this.searchProgress = new SearchProgress();
                this.searchResults = [];
                let infoElement = document.querySelector('.search .progress .search-target');
                infoElement.innerHTML = 'Starting up';
                this.toggleAddTagsHintVisibility();
                break;
            case 1:
                this.steps.crawl = false;
                this.steps.download = false;
                return;
            case 2:
                break;
            case 3:
                break;
        }
        this.steps = copy(this.steps);
        // console.log(this.steps);
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
            ]
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
        // console.log(dropdown);
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
        // manually refresh search component loading
        this.keywords = copy(this.keywords);
        // send keyword requests, using ws
        this.send({ value: this.keywords, type: 'search' });
        // reset progress
        // this.resetProgress();
        // setup search results types & resets total progress
        this.setupSearchResults();
    }

    setupSearchResults() {
        this.searchProgress = new SearchProgress();
        for (let i = 0; i < this.keywords.length; i++) {
            let keyword = this.keywords[i];
            switch (keyword.type) {
                case 'uid':
                    this.searchResults.push(new SearchUIDResult());
                    ++this.searchProgress.nums.uid;
                    break;
                case 'uname':
                    this.searchResults.push(new SearchUNameResult());
                    ++this.searchProgress.nums.uname;
                    break;
                case 'tag':
                    this.searchResults.push(new SearchTagResult());
                    ++this.searchProgress.nums.tag;
                    break;
                case 'pid':
                    this.searchResults.push(new SearchTagResult());
                    ++this.searchProgress.nums.pid;
                    break;
            }
        }
        // generates abstract
        let cnt = this.searchProgress.nums;
        let sentences = [];
        if (cnt.uid) sentences.push(`<span>${cnt.uid}</span> user ids`);
        if (cnt.uname) sentences.push(`<span>${cnt.uname}</span> user names`);
        if (cnt.tag) sentences.push(`<span>${cnt.tag}</span> tags`);
        if (cnt.pid) sentences.push(`<span>${cnt.pid}</span> picture ids`);
        let abstract = document.querySelector('.pixcrawl .search .abstract');
        abstract.innerHTML = sentences.join(', ') + '.';
        this.searchProgress = copy(this.searchProgress);
        this.updateSearchProgressAbstract();
        this.steps.search = true;
        this.steps = copy(this.steps);
    }

    /** Updates search progress abstract */
    updateSearchProgressAbstract() {
        let abstractElement = document.querySelector('.search .progress .abstract');
        let infoStrs = [];
        // console.log(this.searchProgress);
        this.setupSearchAbstract('uid', 'user id', infoStrs);
        this.setupSearchAbstract('pid', 'picture id', infoStrs);
        this.setupSearchAbstract('uname', 'user name', infoStrs);
        this.setupSearchAbstract('tag', 'tag', infoStrs);
        // console.log(infoStrs);
        if (infoStrs.length)
            abstractElement.innerHTML = infoStrs.join(', ') + '.';
        else
            abstractElement.innerHTML = 'No keywords specified.';
    }

    /** Sets up search abstract with xxx user ids, xxx tags, xxx user names, ...
     * @param {string} tagName
     * @param {string} tagDesc
     * @param {string[]} infoStrs
     */
    setupSearchAbstract(tagName, tagDesc, infoStrs) {
        let retVal = '';
        if (this.searchProgress.nums[tagName]) {
            if (this.searchProgress.nums[tagName] - 1) {
                retVal = `<span>${this.searchProgress.nums[tagName]}</span> ${tagDesc}s`;
            } else {
                retVal = `<span>${this.searchProgress.nums[tagName]}</span> ${tagDesc}`;
            }
        }
        if (retVal)
            infoStrs.push(retVal);
    }

    checkKeywords() {
        let hint = document.querySelector('.hint');
        hint.style.display = 'none';
        let errorIndex = [];
        let errorType = {
            null: false,
            empty: false,
            nonnumber: false,
            identical: false,
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
            // identical
            for (let j = i + 1; j < this.keywords.length; j++) {
                let keywordComparing = this.keywords[j];
                if (keyword.type == keywordComparing.type && keyword.value == keywordComparing.value) {
                    errorIndex.push(i, j);
                    errorType.identical = true;
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
        if (errorType.identical)
            info.push('At least one pair of keywords are identical.')
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

    /** Updates the search progress info
     * @param {string} info
     */
    updateSearchProgressInfo(info) {
        let infoElement = document.querySelector('.search .progress .search-target');
        if (this.searchProgress.searchCnt < this.keywords.length)
            infoElement.innerHTML = info;
        else
            infoElement.innerHTML = 'Completed';
    }

    /** @param {SearchUIDResponse | SearchUIDExtendedResponse} value */
    fillUid(value) {
        let result = this.searchResults[value.index];
        if (!value.extended) {
            result.elementState.display = true;
            result.success = !value.result;
            if (!result.success) {
                this.searchResults = copy(this.searchResults);
                return
            };
            result.avatar = value.avatar;
            result.uname = value.value;
            this.searchResults = copy(this.searchResults);
            this.updateSearchProgressInfo(`Searched UID ${this.keywords[value.index].value}: UNAME ${result.uname}`);
            return;
        }
        // console.log(result);
        result.elementState.searching = false;
        result.elementState.expand = true;
        result.extended = true;
        switch (this.keywords[value.index].type) {
            case 'uid':
                result.pictures = value.pictures;
                result.tags = value.tags;
                break;
            case 'uname':
                result.value[result.extendIndex].extended = true;
                result.value[result.extendIndex].pictures = value.pictures;
                result.value[result.extendIndex].tags = value.tags;
        }
        this.searchResults = copy(this.searchResults);
    }

    /** @param {SearchUNameResponse | SearchUIDExtendedResponse} value */
    fillUname(value) {
        let result = this.searchResults[value.index];
        if (!value.extended) {
            result.elementState.display = true;
            result.success = !value.result;
            if (!result.success) {
                this.searchResults = copy(this.searchResults);
                return
            };
            result.value = [];
            for (let i = 0; i < value.value.length; i++) {
                let v = value.value[i];
                v.extended = false;
                v.pictures = [];
                v.tags = [];
                result.value.push(v);
            }
            this.searchResults = copy(this.searchResults);
            this.updateSearchProgressInfo(`Searched UNAME ${this.keywords[value.index].value}`)
            return;
        }
        result.value[result.extendIndex].pictures = value.pictures;
        result.value[result.extendIndex].tags = value.tags;
        result.vlaue[result.extendIndex].extended = true;
        result.elementState.searching = false;
        result.elementState.expand = true;
        this.searchResults = copy(this.searchResults);
    }

    /** @param {SearchTagResponse | SearchTagExtendedResponse} value */
    fillTag(value) {
        let result = this.searchResults[value.index];
        if (!value.extended) {
            result.elementState.display = true;
            result.success = !value.result;
            if (!result.success) {
                this.searchResults = copy(this.searchResults);
                return
            };
            result.value = [];
            // console.log(value.value);
            for (let i = 0; i < value.value.length; i++) {
                let v = value.value[i];
                v.extended = false;
                result.value.push(v);
            }
            result.value[0].extended = true;
            // console.log(result);
            this.searchResults = copy(this.searchResults);
            this.updateSearchProgressInfo(`Searched TAG ${this.keywords[value.index].value}`)
            return;
        }
        result.value[0].extended = true;
        result.value[0].avatar = value.avatar;
        result.elementState.searching = false;
        this.searchResults = copy(this.searchResults);
    }

    /** @param {SearchPIDResponse | SearchPIDExtendedResponse} value */
    fillPid(value) {
        let result = this.searchResults[value.index];
        if (!value.extended) {
            result.elementState.display = true;
            result.success = !value.result;
            if (!result.success) {
                this.searchResults = copy(this.searchResults);
                return
            };
            result.pname = value.pname;
            result.avatar = value.avatar;
            result.tags = value.tags;
            result.author = value.author;
            this.searchResults = copy(this.searchResults);
            this.updateSearchProgressInfo(`Searched PID ${this.keywords[value.index].value}: PNAME ${result.pname}`)
            return;
        }
        result.original = value.picture;
        result.elementState.searching = false;
        result.elementState.originalPicture = true;
        result.extended = true;
        this.searchResults = copy(this.searchResults);
    }

    /** @param {number} idx */
    @action toggleDetailedSearchResult(idx) {
        let result = this.searchResults[idx];
        if (!result.elementState.expand) {
            switch (this.keywords[idx].type) {
                case 'uid':
                    if (!result.extended) {
                        result.elementState.searching = true;
                        result.elementState.expand = false;
                        this.send({
                            type: 'extendedSearch',
                            value: this.keywords[idx],
                        });
                    } else {
                        result.elementState.expand = true;
                    }
                    break;
                case 'uname':
                    result.elementState.expand = true;
                    break;
                case 'tag':
                    result.elementState.expand = true;
                    break;
                case 'pid':
                    result.elementState.expand = true;
                    break;
            }
            this.searchResults = copy(this.searchResults);
            return;
        }
        result.elementState.expand = false;
        this.searchResults = copy(this.searchResults);
    }

    @action toggleDetailedUserInfo(kwdIdx, resultIdx) {
        let result = this.searchResults[kwdIdx];
        if (!result.extended) {
            if (!result.value[resultIdx].extended) {
                // result.value[result.extendIndex].extended = true;
                result.elementState.searching = true;
                result.elementState.expand = false;
                result.extendIndex = resultIdx;
                this.send({
                    type: 'extendedSearch',
                    value: {
                        type: 'uid',
                        value: result.value[resultIdx].uid,
                        index: kwdIdx,
                    },
                });
            } else {
                result.extended = true;
                result.elementState.expand = true;
            }
            this.searchResults = copy(this.searchResults);
            return;
        }
        result.extended = false;
        result.elementState.expand = true;
        this.searchResults = copy(this.searchResults);
    }

    /** @param {number} idx */
    @action deleteSearchOption(idx) {
        let kwd = this.keywords.splice(idx, 1)[0];
        this.searchResults.splice(idx, 1);
        for (let i = idx; i < this.keywords.length; i++) {
            this.keywords[i].index--;
        }
        this.keywords = copy(this.keywords);
        this.searchResults = copy(this.searchResults);
        --this.searchProgress.searchCnt;
        --this.searchProgress.nums[kwd.type];
        this.updateSearchProgressAbstract();
    }

    /** @param {number} kwdIdx
     *  @param {number} resultIdx
     */
    @action selectCandidate(kwdIdx, resultIdx) {
        let result = this.searchResults[kwdIdx];
        let candidate = result.value.splice(resultIdx, 1)[0];
        result.value.unshift(candidate);
        // if tag selected, a new request to get avatar is sent.
        if (this.keywords[kwdIdx].type == 'tag') {
            if (!result.value[0].extended) {
                result.elementState.expand = false;
                result.elementState.searching = true;
                console.log(result);
                this.send({ type: 'extendedSearch', value: { type: 'tag', value: result.value[0].tag, index: kwdIdx } });
            }
        }
        this.searchResults = copy(this.searchResults);
    }

    @action openOriginalPicture(index) {
        let result = this.searchResults[index];
        if (!result.extended) {
            result.elementState.searching = true;
            this.searchResults = copy(this.searchResults);
            this.send({ type: 'extendedSearch', value: { type: 'pid', value: this.keywords[index].value, index: index } })
        } else {
            result.elementState.originalPicture = true;
            this.searchResults = copy(this.searchResults);
        }
    }

    @action closeOriginalPicture(index) {
        let result = this.searchResults[index];
        result.elementState.originalPicture = false;
        this.searchResults = copy(this.searchResults);
    }

    @action
    addNewTagInSearch(tag) {
        let kwd = {
            type: 'tag',
            value: tag,
            index: this.keywords.length,
            dropdown: [
                { tag: 'TAG', desc: 'Tag' },
                { tag: 'UID', desc: 'User ID' },
                { tag: 'PID', desc: 'Picture ID' },
                { tag: 'UNAME', desc: 'User Name' },
            ]
        };
        this.keywords.push(kwd);
        this.send({ type: 'search', value: [kwd] });
        this.searchResults.push(new SearchTagResult());
        this.keywords = copy(this.keywords);
        this.searchResults = copy(this.searchResults);
        this.updateSearchProgressInfo(`Searching additional tag ${kwd.value}`);
        ++this.searchProgress.nums.tag;
        this.updateSearchProgressAbstract();
        // console.log(this.keywords);
    }

    @action goToCrawl() {
        // going to crawling does not require a recheck. collect successful results and go on!
        if (!this.siftSearchResults()) return;
        this.steps.crawl = true;
        this.steps = copy(this.steps);
    }

    siftSearchResults() {
        for (let i = 0; i < this.searchResults.length; i++) {
            let result = this.searchResults[i];
            if (!result.success) {
                this.searchResults.splice(i, 1);
                this.keywords.splice(i, 1);
            }
            this.keywords = copy(this.keywords);
            this.searchResults = copy(this.searchResults);
        }
        // if no result is left after sifting, pilots the user back to keyword.
        if (!this.searchResults.length) {
            this.goBack(0);
            let hint = document.querySelector('.hint');
            hint.style.display = 'block';
            let hintContent = document.querySelector('.hint .content');
            hintContent.innerHTML = 'No available crawl targets left. Navigated back to keyword step.';
            return false;
        }
        return true;
    }
}
