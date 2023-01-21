import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class PixcrawlPbarComponent extends Component {
    steps = ['keyword', 'search', 'index', 'download'];

    @tracked
    clickStatus = {
        keyword: 0,
        search: 0,
        index: 0,
        download: 0,
    };

    @action
    setClickable() {
        const highlightIdx = this.steps.findIndex(
            (step) => step == this.args.highlight
        );
        const nodeElements = document.querySelectorAll('.pixcrawl.pbar .node');
        for (let i = 0; i < nodeElements.length; i++) {
            const nodeElement = nodeElements[i];
            if (i < highlightIdx) {
                nodeElement.classList.add('stepped');
                this.clickStatus[this.steps[i]] = 1;
            }
        }
        this.clickStatus = JSON.parse(JSON.stringify(this.clickStatus));
    }

    /**
     * @param {string} from
     * @param {string} to
     * @param {number} index
     */
    @action
    connect(from, to, index) {
        const line = document.querySelectorAll('.pixcrawl.pbar .jointline')[
            index - 1
        ];
        const elementA = document.querySelector(
            `.pixcrawl.pbar .node.${from} .dot`
        );
        const elementB = document.querySelector(
            `.pixcrawl.pbar .node.${to} .dot`
        );
        const getCenterPoint = (element) => {
            return [
                element.getBoundingClientRect().left + element.clientWidth / 2,
                element.getBoundingClientRect().top + element.clientHeight / 2,
            ];
        };
        const [xA, yA] = getCenterPoint(elementA);
        const [xB, _] = getCenterPoint(elementB);
        // console.log(xA, yA, xB, yB);
        line.style.top = `${yA - 1}px`;
        line.style.left = `${xA}px`;
        line.style.width = `${Math.abs(xB - xA)}px`;
        // register reconnection for resizing
        const that = this;
        window.onresize = function () {
            that.connect('keyword', 'search', 1);
            that.connect('search', 'index', 2);
            that.connect('index', 'download', 3);
        };
    }
}
