import { helper } from '@ember/component/helper';

function inSearchUids([keywords, searchResults, uid, idx]) {
    for (let i = 0; i < searchResults.length; ++i) {
        if (i == idx) continue;
        let result = searchResults[i];
        let keyword = keywords[i];
        if (keyword.type == 'uid') {
            if (keyword.value == uid) return true;
        } else if (keyword.type == 'uname') {
            for (let i = 0; i < result.value.length; i++) {
                if (result.value[i].uid == uid) return true;
            }
        }
    }
    return false;
}

export default helper(inSearchUids);
