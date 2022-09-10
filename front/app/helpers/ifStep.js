import { helper } from '@ember/component/helper';

function ifStep([steps, stepName]) {
    switch (stepName) {
        case 'keyword':
            return steps.keyword && !steps.search;
        case 'search':
            return steps.search && !steps.crawl;
        case 'crawl':
            return steps.crawl && !steps.download;
        case 'download':
            return steps.download;
        default:
            return false;
    }
}

export default helper(ifStep);
