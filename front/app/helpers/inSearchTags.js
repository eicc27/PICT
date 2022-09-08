import { helper } from '@ember/component/helper';

function inSearchTags([keywords, searchResults, tag, idx]) {
    for (let i = 0; i < searchResults.length; ++i) {
        if (i == idx) continue;
        let result = searchResults[i];
        let keyword = keywords[i];
        if (keyword.type == 'tag') {
            if (result.value[0].tag == tag) return true;
        }
    }
    return false;
}

export default helper(inSearchTags);
