import { helper } from '@ember/component/helper';

function tuc([s]) {
    return s.toUpperCase();
}

export default helper(tuc);
