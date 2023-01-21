import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class CommonJumpoutComponent extends Component {
    @action
    deleteJumpout() {
        const jumpoutElements = document.querySelectorAll('.jumpout');
        for (const element of jumpoutElements) {
            element.remove();
        }
    }
}
