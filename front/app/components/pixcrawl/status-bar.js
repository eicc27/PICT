import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import PixcrawlService from '../../services/pixcrawl';
import { A } from '@ember/array';

export default class PixcrawlChecker extends Component {
    /** @type {PixcrawlService} */
    @service('pixcrawl') pixcrawlService;

    @action
    refresh() {
        this.pixcrawlService.clear();
    }

    @action
    checkKeyword() {
        const checkResult = this.pixcrawlService.checkKeyword();
        if (checkResult == 0 && this.pixcrawlService.step == 'keyword') {
            this.pixcrawlService.step = 'search';
            this.pixcrawlService.sendSearchRequest();
        }
    }

    @action
    checkSearch() {
        this.pixcrawlService.step = 'index';
        this.pixcrawlService.sendIndexRequest();
    }
}
