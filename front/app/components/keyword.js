import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import KeywordService from '../services/keyword';
import PixcrawlService from '../services/pixcrawl';
import axios from 'axios';
import ENV from 'front/config/environment';

export default class PixcrawlKeywordComponent extends Component {
    /** @type {ResizeObserver} */
    observer;
    /** @type {KeywordService} */
    @service('keyword') keywords;
    /** @type {PixcrawlService} */
    @service('pixcrawl') socket;

    @tracked hasError = false;

    @tracked errorMessage = '';

    @tracked isFirstUse = true;

    @tracked isAddTag = false;

    @action addItem() {
        this.isFirstUse = false;
        this.keywords.add({
            type: 'uid',
            value: '',
        });
        console.log(this.keywords.keywords);
    }

    @action toggleAddTag() {
        this.isAddTag = !this.isAddTag;
    }

    @action setup() {
        this.setAutoResizeLeftbar();
        const that = this;
        window.onbeforeunload = async function () {
            await axios.post('http://localhost:3000/saveProgress', {
                progress: 'keyword',
                keywords: that.keywords.keywords,
            });
        }
    }

    setAutoResizeLeftbar() {
        const mainWindowElement = document.querySelector('.main .keywords');
        const resize = function () {
            const leftbarElement = document.querySelector('.zebra.leftbar');
            const height = mainWindowElement.getBoundingClientRect().height;
            leftbarElement.style.height = `${height}px`;
            const ratio = 1024 / height;
            leftbarElement.style.background = `repeating-linear-gradient(-45deg, transparent, transparent ${ratio / 2
                }%, darkorange ${ratio / 2}%, darkorange ${ratio}%)`;
        };
        this.observer = new ResizeObserver(resize);
        this.observer.observe(mainWindowElement);
    }

    @action setType(index, type) {
        this.keywords.setType(index, type);
    }

    @action setValue(index, value) {
        this.keywords.setValue(index, value);
    }

    @action getKeyword(index) {
        return this.keywords.get(index);
    }

    @action resetError() {
        this.hasError = false;
    }

    checkKeywords() {
        if (!this.keywords.keywords.length) {
            this.errorMessage = '未指定关键字';
            return false;
        }
        for (const keyword of this.keywords.keywords) {
            if (!keyword.value || !keyword.value.length) {
                this.errorMessage = '有关键字为空';
                return false;
            }
            if (keyword.type == 'uid' || keyword.type == 'pid') { // must be pure number
                const value = keyword.value;
                const match = value.match(/[0-9]/g);
                if (!match || value.length != match.length) { // `isalnum`
                    this.errorMessage = 'PID 或者 UID 必须为纯数字';
                    return false;
                }
            }
        }
        return true;
    }

    /** Checks basic legality of keywords before continue */
    @action
    continue() {
        this.hasError = !this.checkKeywords();
        if (this.hasError) return;
        this.socket.sendKeywords(this.keywords);
        this.observer.disconnect();
        // console.log(ENV.CRAWL_PROG);
        ENV.CRAWL_PROG = 'search';
        const nextElement = document.querySelector('.next .link-next');
        nextElement.click();
    }
}
