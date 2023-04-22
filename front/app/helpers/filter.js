import { helper } from '@ember/component/helper';

/** @param {string[]} args */
function filter(args) {
    const type = args[0];
    const index = args[1];
    return type.options[index[0]].items[index[1]].title;
}

export default helper(filter);
