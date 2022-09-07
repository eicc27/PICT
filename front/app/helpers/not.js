import { helper } from '@ember/component/helper';

function not(arg) {
    return arg != 'true';
}

export default helper(not);
