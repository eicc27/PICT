import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';


export default class FmFilterTypeComponent extends Component {
    @action
    onSelect(item) {
        console.log(item);
    }
}
