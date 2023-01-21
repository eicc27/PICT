import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import axios from 'axios';
import { HINT_LIST_CN, SECTION_INTRO_CN } from '../lang/zh';

export default class HomeComponent extends Component {
    @tracked route = '';
    @tracked transition = false;
    @tracked title = '';
    @tracked description = '';
    @tracked hintText = '';
    isSystemInfo = true;
    systemInfo = {
        title: '',
        desc: '',
    };

    /** @param {number} maxnum */
    @action
    addRandomTriangles(maxnum = 20) {
        const canvasElement = document.querySelector('.home.canvas');
        const randomPosition = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            return [
                Math.floor(Math.random() * w),
                Math.floor(Math.random() * h),
            ];
        };
        const randomSize = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        const createTriangleElement = () => {
            const triangleElement = document.createElement('div');
            triangleElement.classList.add('home');
            triangleElement.classList.add('background-triangle');
            const position = randomPosition();
            const size = randomSize(10, 20);
            triangleElement.style.left = `${position[0]}px`;
            triangleElement.style.top = `${position[1]}px`;
            triangleElement.style.width = `${size}px`;
            triangleElement.style.height = `${size}px`;
            const animationTime = Math.floor(Math.random() * 10) + 5;
            triangleElement.style.animation = `triangle-float ${animationTime}s linear forwards`;
            triangleElement.onanimationend = () => {
                triangleElement.remove();
                createTriangleElement();
            };
            canvasElement.appendChild(triangleElement);
        };
        for (let i = 0; i < maxnum; i++) {
            createTriangleElement();
        }
    }

    /** @param {string} route */
    @action
    startTransitionTo(route) {
        this.transition = true;
        this.route = route;
    }

    @action
    randomHintText() {
        const len = HINT_LIST_CN.length;
        this.hintText = HINT_LIST_CN[Math.floor(Math.random() * len)];
    }

    @action
    getSystemInfo() {
        axios.get('http://localhost:3000/system').then(
            (resp) => {
                this.systemInfo.title = '系统信息';
                this.systemInfo.desc = resp.data.msg;
                this.title = this.systemInfo.title;
                this.description = this.systemInfo.desc;
            },
            () => {
                this.systemInfo.title = '发生后端错误';
                this.systemInfo.desc =
                    '请检查PICT后端（默认端口3000）是否正常启动';
                this.title = this.systemInfo.title;
                this.description = this.systemInfo.desc;
            }
        );
    }

    /** @param {string} section */
    @action toggleIntro(section) {
        console.log(`[fcall] toggleIntro(${section})`);
        if (this.isSystemInfo) {
            this.title = SECTION_INTRO_CN[section].title;
            this.description = SECTION_INTRO_CN[section].desc;
        } else {
            this.title = this.systemInfo.title;
            this.description = this.systemInfo.desc;
        }
        this.isSystemInfo = !this.isSystemInfo;
    }
}
