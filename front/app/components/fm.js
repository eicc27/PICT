import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import ENV from 'front/config/environment';
import axios from 'axios';

export default class FmComponent extends Component {
    @service fm;

    @action setPictureMove() {
        const X = 1;
        const Y = 1;
        const windowCenterX = window.innerWidth / 2;
        const windowCenterY = window.innerHeight / 2;
        const element = document.querySelector('.summary .background');
        document.onmousemove =  function (e) {
            const x = (e.pageX - windowCenterX) / windowCenterX * X;
            const y = (e.pageY - windowCenterY) / windowCenterY * Y;
            element.style.transform = `rotate3d(${x}, ${y}, 0.4, ${x}deg)`;
        };
        window.onbeforeunload = function () {
            document.onmousemove = null;
        };
    }

}