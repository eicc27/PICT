import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class DownloadBarComponent extends Component {
    ws = new WebSocket('ws://localhost:3001/download');
    progressBar = null;
    total = 0;
    progress = 0;
    @tracked
    percent = 0;

    constructor() {
        super(...arguments);
        this.ws.onmessage = (event) => {
            this.updateProgress(event.data);
        };
    }

    resetProgress(total) {
        this.progressBar.style.width = '0%';
        this.total = total;
        this.progress = 0;
        this.percent = 0;
    }

    updateProgress(data) {
        if (data.includes('content-length')) {
            this.progressBar = document
                .getElementsByClassName('download-bar')[0]
                .getElementsByClassName('progress')[0];
            this.resetProgress(parseInt(data.split('content-length: ')[1]));
            return;
        }
        let updateData = parseInt(data.split(': ')[1]);
        if (updateData) {
            this.progress += updateData;
            this.percent = (this.progress / this.total) * 100;
            let px = this.percent * 3;
            this.percent = Math.round(this.percent);
            this.progressBar.style.width = px + 'px';
            console.log(px);
        }
    }

    @action
    startDownload() {
        this.ws.send('start');
    }
}
