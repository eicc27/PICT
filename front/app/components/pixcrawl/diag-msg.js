import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class DiagMsgComponent extends Component {
    @action
    hideMsg() {
        let diag = document.getElementsByClassName('diag-msg')[0];
        diag.style.display = 'none';
    }
}
