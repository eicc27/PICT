import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import PixcrawlService from '../../services/pixcrawl';
import { A } from '@ember/array';

export default class PixcrawlStatusBarItemComponent extends Component {
    @tracked showDetails = false;

    @action
    toggleDetails() {
        this.showDetails = !this.showDetails;
    }
}