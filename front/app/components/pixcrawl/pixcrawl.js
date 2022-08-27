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
    inputElement.style.width = `${charContentLength * 8 + nonCharContentLength * 15
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

    @tracked
    searchResults = [];

    @tracked
    crawlResults = [];

    @service('pixcrawl')
    pixcrawlWS;

    toggleAddTagsHintVisibility() {
        // controls the hint visibility
        let hint = document.querySelector('.keyword .add-tags span');
        hint.style.display = this.keywords.length ? 'none' : 'block';
    }

    @action
    setVisibility() {
        let pixcrawlElement = document.getElementsByClassName('pixcrawl')[0];
        if (window.location.href.includes('pixcrawl'))
            pixcrawlElement.style.display = 'flex';
        else pixcrawlElement.style.display = 'none';
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
        // send keyword requests, using ws
        this.pixcrawlWS.search(this.keywords);
    }

    checkKeywords() {
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
                if (!value.match(/[0-9]/g) || value.match(/[0-9]/g).length != value.length) {
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
        if (errorType.nonnumber) info.push('At least one PID or UID is not pure number.');
        if (info.length) {
            let hint = document.querySelector('.hint');
            hint.style.display = 'block';
            let hintContent = document.querySelector('.hint .content');
            hintContent.innerHTML = info.join(' ');
        }
        // highlights error tags
        let tags = document.querySelectorAll('.keyword .main .tag-item')
        for(let i = 0; i < errorIndex.length; i++) {
            let index = errorIndex[i];
            let tag = tags[index];
            // refreshes animation
            tag.style.animation = 'tagitem-highlight 0.2s ease-out forwards, tagitem-dim 0.2s 5.2s ease-out forwards';
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
            let tag = document.querySelectorAll('.keyword .main .tag-item')[index];
            tag.style.animation = 'none';
        }
    }
}
