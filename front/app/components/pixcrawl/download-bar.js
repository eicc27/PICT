import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class DownloadBarComponent extends Component {
    ws = new WebSocket('ws://localhost:3001/download');
    constructor() {
        super(...arguments);
        this.ws.onmessage = (event) => {
            console.log(event.data);
        };
    }
    @action
    startDownload() {
        this.ws.send('start');
    }
}
