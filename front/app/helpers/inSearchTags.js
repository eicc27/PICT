import { helper } from '@ember/component/helper';

function inSearchTags([searchResults, tag]) {
    for (let i = 0; i < searchResults.length; ++i) {
        let result = searchResults[i];
        if (result.type != 'tag') continue;
        if (tag == searchResults.result.name) return true;
    }
    return false;
}

export default helper(inSearchTags);
