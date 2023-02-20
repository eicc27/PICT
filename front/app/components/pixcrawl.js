import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import PixcrawlService from '../services/pixcrawl';


export default class PixcrawlComponent extends Component {
    /** @type {PixcrawlService} */
    @service('pixcrawl') pixcrawlService;

    @action
    addKeywordOption() {
        const option = {
            type: 'uid',
            value: ''
        };
        this.pixcrawlService.addKeyword(option);
    }

    @action
    didInsert() {
        this.pixcrawlService.listen();
    }

    @action
    willDestroyPage() {
        this.pixcrawlService.detach();
    }
}