import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

function buf2ab(buffer) {
    const ab = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
    }
    return view;
}

export default class PixcrawlUidResultComponent extends Component {
    @action
    showImage() {
        console.log(this.args.uidResult);
        const buffer = this.args.uidResult.value.thumbnail.data;
        const imgElement = document.querySelectorAll('.results .avatar')[this.args.index];
        const blob = new Blob([buf2ab(buffer)], { type: 'image/png' });
        imgElement.src = window.URL.createObjectURL(blob);
    }
}