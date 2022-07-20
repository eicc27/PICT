import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class DragdownItemComponent extends Component {
    @action
    changeTag(tagName, index, tags) {
        let tag = document.getElementsByClassName('tag-type')[index];
        tag.innerHTML = tagName;
        this.hideDragdown(index);
        tags[index].tag = tagName;
    }

    hideDragdown(index) {
        // console.log('leave');
        let dragdown = document.getElementsByClassName('tag-dragdown')[index];
        dragdown.style.display = 'none';
        let tag = document.getElementsByClassName('tag-type')[index];
        tag.style.display = 'block';
    }
}
