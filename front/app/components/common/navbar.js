import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { HINT_LIST_CN } from '../../lang/zh';

export default class CommonNavbarComponent extends Component {
    @tracked transition = false;
    @tracked hintText = '';
    @tracked route = '';

    @action
    randomHintText() {
        const len = HINT_LIST_CN.length;
        this.hintText = HINT_LIST_CN[Math.floor(Math.random() * len)];
    }

    /** @param {string} route */
    @action
    startTransitionTo(route) {
        if (this.args.route == route) return;
        this.transition = true;
        this.route = route;
    }
}
