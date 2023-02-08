import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import ENV from 'front/config/environment';
import axios from 'axios';


export default class DownloadComponent extends Component {
    @service('pixcrawl') socket;

    @service('download') downloadResults;

    @service('keyword') keywords;

    @action recieveDownloadRequests() {
        this.socket.recieveDownloadRequests(this.downloadResults);
        window.onbeforeunload = async function() {
            await axios.post('http://localhost:3000/saveProgress', {
                progress: 'download',
                keywords: that.keywords.keywords,
            });
        }
    }

    @action back() {
        this.downloadResults.clear();
        axios.get('')
        const prevElement = document.querySelector('.prev .link-prev');
        prevElement.click();
    }
}
