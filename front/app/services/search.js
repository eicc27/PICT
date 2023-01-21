import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';


export default class SearchService extends Service {
    searchResults = A([]);

    @tracked total = 0;

    @tracked count = 0;

    get(index) {
        return this.searchResults.get(index);
    }

    add(result) {
        this.searchResults.pushObject(result);
    }

    adds(result) {
        this.searchResults.pushObjects(result);
    }

    clear() {
        this.searchResults.clear();
        this.count = 0;
        this.total = 0;
    }

    updateTotal(total) {
        this.total = total;
    }

    updateCount() {
        this.count++;
    }

    setSearch(searchResults) {
        this.searchResults.clear();
        this.searchResults.pushObjects(searchResults.searchResults);
        this.total = searchResults.total;
        this.count = searchResults.count;
    }
}