import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class NavbarComponent extends Component {
    navRoute = {
        Home: '/',
        PixCrawl: '/pixcrawl',
        Settings: '/settings',
        'File Manager': '/fm',
        IRIS: '/iris',
    };

    @tracked
    direction = 'left';

    @action
    navTo(page) {
        let timeOut = 600;
        if (page == 'Home') this.direction = 'left';
        else this.direction = 'right';
        let arrowTranses = document.getElementsByClassName('arrow-trans');
        let arrowTrans = page == 'Home' ? arrowTranses[0] : arrowTranses[1];
        arrowTrans.style.display = 'block';
        setTimeout(() => {
            window.location.href = this.navRoute[page];
        }, timeOut);
    }
}
