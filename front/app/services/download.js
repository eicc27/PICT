import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';


export default class DownloadService extends Service {
    @tracked total = 0;

    @tracked count = 0;

    clear() {
        this.count = 0;
        this.total = 0;
    }

    updateTotal(total) {
        this.total = total;
    }

    updateCount() {
        this.count++;
    }

    setDownload(downloadResults) {
        this.total = downloadResults.total;
        this.count = downloadResults.count;
    }
}