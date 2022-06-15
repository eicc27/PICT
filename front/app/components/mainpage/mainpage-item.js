import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class MainpageItemComponent extends Component {
    @action
    showDesc() {
        let log = document.getElementsByClassName('diag-info')[0];
        log.style.display = 'none';
        let desc =
            document.getElementsByClassName('desc-content')[
                parseInt(this.args.index)
            ];
        desc.style.display = 'block';
    }

    @action
    hideDesc() {
        let log = document.getElementsByClassName('diag-info')[0];
        log.style.display = 'block';
        let desc =
            document.getElementsByClassName('desc-content')[
                parseInt(this.args.index)
            ];
        desc.style.display = 'none';
    }

    @action
    animate() {
        let trans = document.getElementsByClassName('jump-trans')[0];
        let transText = trans.getElementsByTagName('h2')[0];
        let timeOut = 600;
        let route = '';
        switch (parseInt(this.args.index)) {
            case 0:
                transText.innerHTML = 'Settings';
                route = 'settings';
                break;
            case 1:
                transText.innerHTML = 'Pixcrawl';
                route = 'pixcrawl';
                break;
            case 2:
                transText.innerHTML = 'FM';
                route = 'fm';
                break;
            case 3:
                transText.innerHTML = 'IRIS';
                route = 'iris';
        }
        trans.style.display = 'flex';
        setTimeout(() => {
            window.location.href = route;
        }, timeOut);
    }
}
