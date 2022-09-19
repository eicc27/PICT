import { helper } from '@ember/component/helper';

function getSize(value) {
    let kb = 1024;
    let mb = 1024 * 1024;
    if (value < kb)
        return `${value}B`;
    else if (value < mb)
        return `${(value / 1024).toFixed(2)}KB`;
    else
        return `${(value / 1024 / 1024).toFixed(2)}MB`;
}

export default helper(getSize);
