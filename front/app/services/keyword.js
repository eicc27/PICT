import Service from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';

export default class KeywordService extends Service {
    keywords = A([]);

    add(keyword) {
        this.keywords.pushObject(keyword);
    }

    remove(index) {
        this.keywords.splice(index, 1);
    }

    setType(index, type) {
        const keyword = this.keywords.get(index);
        this.keywords.set(index, {
            type: type,
            value: keyword.value,
        });
    }

    setValue(index, value) {
        const keyword = this.keywords.get(index);
        this.keywords.set(index, {
            type: keyword.type,
            value: value,
        });
    }

    get(index) {
        return this.keywords.get(index);
    }

    clear() {
        this.keywords.clear();
    }

    setKeyword(keywords) {
        this.clear();
        this.keywords.addObjects(keywords);
    }
}
