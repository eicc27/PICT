import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';


export default class IndexService extends Service {
    indexResults = A([]);
    @tracked total = 0;
    @tracked count = 0;

    get(index) {
        return this.indexResults.get(index);
    }

    add(result) {
        this.indexResults.pushObject(result);
    }

    adds(result) {
        this.indexResults.pushObjects(result);
    }

    clear() {
        this.indexResults.clear();
        this.count = 0;
        this.total = 0;
    }

    updateCount() {
        this.count++;
        // console.log(this.count);
    }

    updateTotal(total) {
        this.total = total;
        // console.log(this.total);
    }

    setIndex(indexResults) {
        this.indexResults.clear();
        this.indexResults.pushObjects(indexResults.indexResults);
        this.total = indexResults.total;
        this.count = indexResults.count;
    }

    decreaseTotal() {
        this.total--;
    }
} 