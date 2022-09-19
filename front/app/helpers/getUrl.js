import { helper } from '@ember/component/helper';

function getUrl(value) {
    let v = String(value);
    return v.split('/').pop();
}

export default helper(getUrl);
