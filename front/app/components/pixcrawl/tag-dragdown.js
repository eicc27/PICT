import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class TagDragdownComponent extends Component {
    @tracked
    tags = [
        { tag: 'uid', desc: 'User ID' },
        { tag: 'pid', desc: 'Picture ID' },
        { tag: 'tag', desc: 'Tag' },
        { tag: 'uname', desc: 'User Name' },
    ];

    copy(target) {
        return JSON.parse(JSON.stringify(target));
    }

    @action
    showDragdown(index) {
        let tagCount = this.tags.length;
        let tag = document.getElementsByClassName('tag-type')[index];
        let tagName = tag.innerHTML.match(/[a-zA-Z]/g).join('');
        tag.style.display = 'none';
        for (let i = 0; i < tagCount; ++i) {
            if (this.tags[i].tag == tagName) {
                // console.log(i);
                let selectedTag = this.tags[i];
                this.tags.splice(i, 1);
                this.tags.unshift(selectedTag);
                // console.log(this.tags);
                this.tags = this.copy(this.tags);
                break;
            }
        }
        let dragdown = document.getElementsByClassName('tag-dragdown')[index];
        dragdown.style.display = 'block';
    }

    @action
    hideDragdown(index) {
        // console.log('leave');
        let dragdown = document.getElementsByClassName('tag-dragdown')[index];
        dragdown.style.display = 'none';
        let tag = document.getElementsByClassName('tag-type')[index];
        tag.style.display = 'block';
    }
}
