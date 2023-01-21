import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

const KWD_TYPE = {
    uid: '用户ID',
    pid: '图片ID',
    uname: '用户名',
    tag: '标签名',
};

export default class PixcrawlKeywordItemComponent extends Component {
    @tracked menu = false;

    @tracked type = '';

    @tracked value = '';

    @tracked menuItems = {};

    @action toggleMenu() {
        this.menu = !this.menu;
    }

    @action setMenuItems() {
        const keys = Object.keys(KWD_TYPE);
        const values = Object.values(KWD_TYPE);
        this.menuItems = {};
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == this.type)
                continue;
            this.menuItems[keys[i]] = values[i];
        }
    }

    @action setType(type) {
        this.args.setType(this.args.index, type);
        this.getKeyword();
        this.toggleMenu();
    }

    @action setValue() {
        const keywordElement = document.querySelectorAll('.keyword-item')[this.args.index];
        const value = keywordElement.querySelector('input').value;
        this.args.setValue(this.args.index, value);
        this.getKeyword();
    }

    @action getKeyword() {
        const keyword = this.args.get(this.args.index);
        this.value = keyword.value;
        this.type = keyword.type;
    }
}