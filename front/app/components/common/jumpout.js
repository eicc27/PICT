import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class CommonJumpoutComponent extends Component {
    @action resetError() {
        const reset = this.args.reset;
        reset();
    }
}
