import { helper } from '@ember/component/helper';

function div([lvalue, rvalue]) {
    return (lvalue / rvalue).toFixed(2);
}

export default helper(div)