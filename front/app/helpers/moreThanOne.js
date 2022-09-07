import { helper } from '@ember/component/helper';

function moreThanOne(value) {
    return value > 1;
}

export default helper(moreThanOne);
