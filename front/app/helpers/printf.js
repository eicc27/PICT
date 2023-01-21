import { helper } from '@ember/component/helper';

/** @param {string[]} args */
function printf(args) {
    let template = args[0];
    const substitutions = args.slice(1);
    const placeholders = template.match(/\$[0-9]+/g);
    for (const placeholder of placeholders) {
        const index = parseInt(placeholder.slice(1));
        template = template.replace(placeholder, substitutions[index - 1]);
    }
    return template;
}

export default helper(printf);
