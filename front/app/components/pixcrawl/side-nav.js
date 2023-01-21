import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PixcrawlSideNavComponent extends Component {
    @tracked
    prev = false;

    @tracked
    next = false;

    @action
    togglePrev() {
        this.prev = !this.prev;
    }

    @action
    toggleNext() {
        this.next = !this.next;
    }

}