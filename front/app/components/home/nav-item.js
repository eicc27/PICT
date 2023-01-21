import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class HomeNavItemComponent extends Component {
    @tracked highlight = false;

    /** @param {string} index */
    @action
    toggleHighlight(index) {
        console.log(`[fcall] toggleHighlight(${index})`);
        index = parseInt(index);
        const navElement = document.querySelectorAll('.home.main li')[index];
        const navTextElement = navElement.querySelector('button');
        if (!this.highlight) {
            // adds a chevron on the left, and underline the text
            navTextElement.style.animation =
                'nav-text-move-left 0.3s linear forwards';
        } else {
            navTextElement.style.animation = 'none';
        }
        this.highlight = !this.highlight;
    }
}
