import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class InputBoxComponent extends Component {
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
        tags = JSON.parse(JSON.stringify(tags));
    }

    @action
    fillWith(kwd, index) {
        let inputElement = document
            .getElementsByClassName('input-box')
            [index].getElementsByTagName('input')[0];
        inputElement.value = kwd;
    }
}
