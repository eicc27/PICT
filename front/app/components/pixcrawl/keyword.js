import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import PixcrawlService from '../../services/pixcrawl';
import { A } from '@ember/array';

const TYPES = ['uid', 'pid', 'uname', 'tag'];

export default class PixcrawlKeywordComponent extends Component {
    /** @type {PixcrawlService} */
    @service('pixcrawl') pixcrawlService;

    @tracked showTypes = false;

    @tracked types = A([]);

    /** @param {number} index */
    @action
    toggleShowTypes() {
        if (this.pixcrawlService.step != 'keyword') return;
        this.showTypes = true;
        this.types.clear();
        const index = this.args.index;
        const keyword = this.pixcrawlService.getKeyword(index);
        const type = keyword.type;
        const typeIndex = TYPES.findIndex((value) => type == value);
        for (let i = 0; i < TYPES.length; i++) {
            if (i == typeIndex) continue;
            this.types.pushObject(TYPES[i]);
        }
    }

    @action
    hideTypes() {
        this.showTypes = false;
    }

    @action
    setType(type) {
        this.showTypes = false;
        const index = this.args.index;
        this.pixcrawlService.setKeywordType(index, type);
    }

    @action
    setValue() {
        const index = this.args.index;
        const inputElement = document.querySelectorAll('.keyword .value')[index];
        const value = inputElement.innerHTML;
        this.pixcrawlService.setKeywordValue(index, value);
    }

    @action
    initValue() {
        const value = this.args.value;
        const index = this.args.index;
        const inputElement = document.querySelectorAll('.keyword .value')[index];
        inputElement.innerHTML = value;
    }
}
