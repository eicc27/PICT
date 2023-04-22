import Component from '@glimmer/component';
import { action } from '@ember/object';


export default class FmFilterItemComponent extends Component {
    @action
    onSelect() {
        this.args.setParam([this.args.i, this.args.j], this.args.type);
    }
}
