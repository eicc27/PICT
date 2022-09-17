import { helper } from '@ember/component/helper';

function toFixed([lvalue, rvalue]) {
    return lvalue.toFixed(rvalue);
}

export default helper(toFixed);