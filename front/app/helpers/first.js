import { helper } from '@ember/component/helper';

function first([array, index]) {
    return array.slice(0, index);
}

export default helper(first);