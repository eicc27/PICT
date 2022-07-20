import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class InputBoxComponent extends Component {
    animationClock = 0;

    @action
    changeWidth(index, tags) {
        let inputElement = document
            .getElementsByClassName('input-box')
            [index].getElementsByTagName('input')[0];
        let inputContent = inputElement.value;
        let chars = inputContent.match(/[\w\s]/g);
        let charLength = 0;
        if (chars) charLength = chars.length;
        let otherLength = inputContent.length - charLength;
        inputElement.style.width = `${charLength * 8 + otherLength * 14}px`;
        tags[index].kwd = inputContent;
    }

    @action
    fillWith(kwd, index, tags) {
        let inputElement = document
            .getElementsByClassName('input-box')
            [index].getElementsByTagName('input')[0];
        inputElement.value = kwd;
        this.changeWidth(index, tags);
    }

    @action
    clearAnimation(index) {
        this.animationClock = ~this.animationClock;
        if (~this.animationClock) {
            let inputBox = document.getElementsByClassName('input-box')[index];
            inputBox.style.animation = 'none';
        }
    }
}
