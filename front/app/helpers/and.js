import { helper } from '@ember/component/helper';

function and(args) {
    return args.reduce((previousValue, currentValue) => {
        return previousValue && currentValue;
    });
}

export default helper(and);
