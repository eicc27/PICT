import { helper } from '@ember/component/helper';

/** @param {unknown[]} args */
function percentage(args) {
    return (args[0] / args[1] * 100).toFixed(2);
}

export default helper(percentage);
