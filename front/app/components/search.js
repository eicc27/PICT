import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import ENV from 'front/config/environment';
import axios from 'axios';


export default class SearchComponent extends Component {
    @service('search') searchResults;
    @service('keyword') keywords;
    @service('pixcrawl') socket;

    @tracked count = {
        total: 0,
        count: 0,
    }

    @action
    recieveSearchResults() {
        this.socket.recieveSearchResults(this.searchResults);
        const that = this;
        window.onbeforeunload = async function() {
            await axios.post('http://localhost:3000/saveProgress', {
                progress: 'search',
                keywords: that.keywords.keywords,
            })
        }
    }

    @action
    back() {
        this.searchResults.clear();
        ENV.CRAWL_PROG = 'keyword';
    }

    @action
    continue() {
        const urls = [];
        for (const result of this.searchResults.searchResults) {
            for (const picture of result.value.pictures) {
                urls.push(picture);
            }
        }
        this.socket.sendSearchResults(urls);
        this.socket.clear();
        ENV.CRAWL_PROG = 'index';
    }
}