import Route from '@ember/routing/route';
import { service } from '@ember/service';
import axios from 'axios';
import ENV from 'front/config/environment';

export default class PixcrawlRoute extends Route {
    @service router;
    @service('keyword') keywords;
    @service('search') searchResults;
    @service('index') indexResults;
    @service('download') downloadResults;
    @service('pixcrawl') socket;

    beforeModel() {
        axios.get('http://localhost:3000/loadProgress').then((response) => {
            const data = response.data;
            console.log(data);
            if (data.progress.length) {
                this.keywords.setKeyword(data.keywords);
                this.searchResults.setSearch(data.searchResults);
                this.indexResults.setIndex(data.indexResults);
                this.downloadResults.setDownload(data.downloadResults);
            }
            this.router.transitionTo(`pixcrawl.${data.progress}`);
        }
        );
    }
}
