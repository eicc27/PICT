import Component from '@glimmer/component';
import { action } from '@ember/object';
import ENV from 'front/config/environment';
import { service } from '@ember/service';

export default class PixcrawlNodeComponent extends Component {
    steps = ['keyword', 'search', 'index', 'download'];

    @service('search') searchResults;

    @service('index') indexResults;

    @action
    changeRoute() {
        ENV.CRAWL_PROG = this.args.step;
        switch (this.args.step) {
            case 'keyword':
                this.searchResults.clear();
                this.indexResults.clear();
                break;
            case 'search':
                this.indexResults.clear();
                break;
        }
        // console.log(ENV.CRAWL_PROG);
    }

    @action
    toggleJointLine() {
        const steps = document.querySelectorAll('.pixcrawl.pbar .node');
        const findIndex = function (step) {
            for (let i = 0; i < steps.length; i++) {
                if (steps[i].classList.contains(step)) {
                    return i;
                }
            }
            return -1;
        };
        const thisIndex = findIndex(this.args.step);
        const highlightIndex = findIndex(this.args.highlight);
        // console.log(thisIndex, highlightIndex);
        const jointLines = document.querySelectorAll(
            '.pixcrawl.pbar .jointline>div'
        );
        let fillLevel = 1;
        /** @type {(Element) => void} */
        const removeFillAnimation = function (jointLine) {
            for (const className of jointLine.classList) {
                if (className.match('fill-lvl'))
                    jointLine.classList.remove(className);
            }
        };
        for (let i = highlightIndex - 1; i >= thisIndex; i--) {
            const jointLine = jointLines[i];
            const fillAnimation = `fill-lvl${fillLevel}`;
            const unfillAnimation = `unfill-lvl${highlightIndex - thisIndex + 1 - fillLevel
                }`;
            if (jointLine.classList.contains(fillAnimation)) {
                removeFillAnimation(jointLine);
                jointLine.classList.add(unfillAnimation);
            } else {
                removeFillAnimation(jointLine);
                jointLine.classList.add(fillAnimation);
            }
            fillLevel++;
        }
    }
}
