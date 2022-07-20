import { helper } from '@ember/component/helper';

function eq([lvalue, rvalue]) {
    return lvalue == rvalue;
}

export default helper(eq);
