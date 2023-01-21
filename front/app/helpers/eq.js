import { helper } from '@ember/component/helper';

/** @param {unknown[]} args */
function eq(args) {
    return args[0] == args[1];
}

export default helper(eq);
