import { helper } from '@ember/component/helper';

function div([lvalue, rvalue]) {
    return (lvalue / rvalue);
}

export default helper(div);