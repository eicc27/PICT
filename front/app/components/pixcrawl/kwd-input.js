import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class KwdInputComponent extends Component {
    @tracked
    tags = [];

    copy(target) {
        return JSON.parse(JSON.stringify(target));
    }

    changeHintStatus() {
        let hint = document
            .getElementsByClassName('kwd-input')[0]
            .getElementsByClassName('placeholder')[0].children[0];
        if (!this.tags.length) {
            hint.style.display = 'block';
        } else {
            hint.style.display = 'none';
        }
    }
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
        this.changeHintStatus();
    }

    @action
    deleteBox(index) {
        console.log(index);
        let kwdInput = document.getElementsByClassName('kwd-input')[0];
        kwdInput.removeChild(kwdInput.children[index + 1]);
        this.tags.splice(index, 1);
        for (let i = index; i < this.tags.length; i++) {
            this.tags[i].index--;
        }
        this.tags = this.copy(this.tags);
        this.changeHintStatus();
    }

    @action
    translateRightAngle() {
        let righeAngle = document.getElementsByClassName('angles-right')[0];
        righeAngle.style.transform = 'translateX(10px)';
    }

    @action
    resetRightAngle() {
        let righeAngle = document.getElementsByClassName('angles-right')[0];
        righeAngle.style.transform = '';
    }

    @action
    toSearch() {
        this.checkKeywords();
    }

    highlightTag(index) {
        let inputBox = document.getElementsByClassName('input-box')[index];
        console.log(inputBox);
        inputBox.style.animation =
            'highlight-inputbox 0.3s ease-in forwards, dim-inputbox 0.3s 5s ease-out forwards';
    }

    checkKeywords() {
        let msg = [];
        if (!this.tags.length) msg.push('No keywords specified.');
        let { hasEmpty, hasNotNumbers } = [false, false];
        for (let i = 0; i < this.tags.length; i++) {
            let hasProblem = false;
            if (this.tags[i].kwd == '') {
                hasEmpty = true;
                hasProblem = true;
            }
            if (this.tags[i].tag == 'uid' || this.tags[i].tag == 'pid') {
                if (this.tags[i].kwd.match(/[^0-9]/g)) {
                    hasNotNumbers = true;
                    hasProblem = true;
                }
            }
            if (hasProblem) {
                this.highlightTag(i);
            }
        }
        if (hasEmpty) msg.push('At least one keyword is empty.');
        if (hasNotNumbers)
            msg.push(
                'At least one User ID tag or Picture ID tag is not pure numbers.'
            );
        let diag = document.getElementsByClassName('diag-msg')[0];
        diag.lastElementChild.innerHTML = msg.join('<br>');
        diag.style.display = 'block';
        return !(hasEmpty || hasNotNumbers);
    }
}
