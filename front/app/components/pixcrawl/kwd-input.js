import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class KwdInputComponent extends Component {
    firstTime = true;

    copy(target) {
        return JSON.parse(JSON.stringify(target));
    }

    @tracked
    tags = [];

    @action
    showAdd() {
        let addNew = document.getElementsByClassName('add-new')[0];
        addNew.getElementsByClassName('icon-tags')[0].style.display = 'block';
        addNew.getElementsByClassName('icon-tag')[0].style.display = 'none';
    }

    @action
    hideAdd() {
        let addNew = document.getElementsByClassName('add-new')[0];
        addNew.getElementsByClassName('icon-tags')[0].style.display = 'none';
        addNew.getElementsByClassName('icon-tag')[0].style.display = 'block';
    }

    @action
    addTag() {
        console.log(this.tags);
        this.tags.push({ tag: 'uid', kwd: '', index: this.tags.length });
        this.tags = this.copy(this.tags);
        if (this.firstTime) {
            console.log(true);
            let placeholder = document.getElementsByClassName('placeholder')[0];
            placeholder.removeChild(placeholder.children[0]);
            this.firstTime = false;
        }
    }

    @action
    deleteBox(index) {
        console.log(index);
        let kwdInput = document.getElementsByClassName('kwd-input')[0];
        kwdInput.removeChild(kwdInput.children[index]);
        this.tags.splice(index, 1);
        for (let i = index; i < this.tags.length; i++) {
            this.tags[i].index--;
        }
        this.tags = this.copy(this.tags);
    }
}
