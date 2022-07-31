import { helper } from '@ember/component/helper';

function or(args) {
    return args.reduce((previousValue, currentValue) => {
        return previousValue || currentValue;
    });
}

export default helper(or);
