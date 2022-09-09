import { helper } from '@ember/component/helper';

function mul([lvalue, rvalue]) {
    return lvalue * rvalue;
}

export default helper(mul);