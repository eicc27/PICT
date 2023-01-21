import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import axios from 'axios';
import ENV from 'front/config/environment';


export default class IndexComponent extends Component {
    @service('index') indexResults;

    @service('pixcrawl') socket;

    @service('keyword') keywords;

    @action recieveIndexResults() {
        this.socket.recieveIndexResults(this.indexResults);
        const that = this;
        window.onbeforeunload = async function () {
            await axios.post('http://localhost:3000/saveProgress', {
                progress: 'index',
                keywords: that.keywords.keywords,
            });
            that.socket.close();
        }
    }

    @action back() {
        this.indexResults.clear();
        ENV.CRAWL_PROG = 'search';
    }

    @action continue() {
        ENV.CRAWL_PROG = 'download';
        this.socket.sendDownloadRequests(this.indexResults.indexResults);
        this.socket.clear();
    }
}