import { helper } from '@ember/component/helper';

function neq([lvalue, rvalue]) {
    return lvalue != rvalue;
}

export default helper(neq);
